import React, { useState } from 'react';
import {
  TrendingUp,
  Receipt,
  IndianRupee,
  Banknote,
  CreditCard,
  QrCode,
  Bed,
} from 'lucide-react';
import { DateRangeFilter } from '../../common/DateRangeFilter';
import { StatCard } from '../../common/StatCard';
import { PaymentModeCard } from '../../common/PaymentModeCard';
import { getLocalDateString } from '../../common/dateUtils';
import { getRevenueAnalysis, RevenueAnalysis } from '../../../../../lib/analysis';
import { downloadRevenueReport, printRevenueReport } from '../restaurantReports';

export const RevenueAnalysisSection: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    end: getLocalDateString(new Date()),
  });
  const [data, setData] = useState<RevenueAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (overrideStart?: string, overrideEnd?: string) => {
    const start = overrideStart ?? dateRange.start;
    const end = overrideEnd ?? dateRange.end;
    if (!start || !end) return;

    const startD = new Date(start);
    const endD = new Date(end);
    if (endD.getTime() - startD.getTime() > 365 * 24 * 60 * 60 * 1000) {
      setError('Date range cannot exceed 1 year. Please select a smaller range.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await getRevenueAnalysis(start, end);
      setData(result);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to fetch revenue analysis';
      setError(msg);
      console.error('Failed to fetch revenue analysis', err);
    } finally {
      setLoading(false);
    }
  };

  const setPresetDateRange = (type: 'today' | 'yesterday' | '7days' | 'month') => {
    setError(null);
    const today = new Date();
    const end = getLocalDateString(today);
    let start = end;

    if (type === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      start = getLocalDateString(y);
      setDateRange({ start, end: start });
      fetchData(start, start);
      return;
    } else if (type === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = getLocalDateString(d);
    } else if (type === 'month') {
      const d = new Date();
      d.setDate(1);
      start = getLocalDateString(d);
    }

    setDateRange({ start, end });
    fetchData(start, end);
  };

  return (
    <section className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 border-t border-white/5">
      <DateRangeFilter
        title="Restaurant Revenue Analysis"
        icon={TrendingUp}
        iconColor="text-primary"
        color={{
          bgLight: 'bg-primary/20',
          text: 'text-primary',
          bgHover: 'bg-primary/30',
          border: 'border-primary/50',
        }}
        startDate={dateRange.start}
        setStartDate={(v: string) => {
          setDateRange((prev) => ({ ...prev, start: v }));
          setError(null);
        }}
        endDate={dateRange.end}
        setEndDate={(v: string) => {
          setDateRange((prev) => ({ ...prev, end: v }));
          setError(null);
        }}
        onGenerate={() => fetchData()}
        loading={loading}
        setDateRangeType={setPresetDateRange}
        error={error}
        onDownload={() => downloadRevenueReport(data, dateRange)}
        onPrint={() => printRevenueReport(data, dateRange)}
        hasData={!!data}
      />

      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <StatCard
              title="Total Base Amount"
              value={`₹${Number(data?.totalBaseAmount || 0).toFixed(2)}`}
              icon={Receipt}
              color="bg-blue-500"
            />
            <StatCard
              title="Total GST Amount"
              value={`₹${Number(data?.totalGstAmount || 0).toFixed(2)}`}
              icon={Receipt}
              color="bg-orange-500"
            />
            <StatCard
              title="Final Discounted Amount"
              value={`₹${Number(data?.totalFinalDiscountedAmount || 0).toFixed(2)}`}
              icon={IndianRupee}
              color="bg-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            <PaymentModeCard
              title="Cash Collection"
              baseAmount={data?.paymentModes?.CASH?.baseAmount ?? 0}
              gstAmount={data?.paymentModes?.CASH?.gstAmount ?? 0}
              totalAmount={
                data?.paymentModes?.CASH?.totalAmount ?? (data?.cashAmount || 0)
              }
              icon={Banknote}
              colorClass="text-emerald-400"
              badgeBg="bg-emerald-500/20"
              borderColor="border-emerald-500/30"
              gradientFrom="from-emerald-500"
            />
            <PaymentModeCard
              title="Card Collection"
              baseAmount={data?.paymentModes?.CARD?.baseAmount ?? 0}
              gstAmount={data?.paymentModes?.CARD?.gstAmount ?? 0}
              totalAmount={
                data?.paymentModes?.CARD?.totalAmount ?? (data?.cardAmount || 0)
              }
              icon={CreditCard}
              colorClass="text-sky-400"
              badgeBg="bg-sky-500/20"
              borderColor="border-sky-500/30"
              gradientFrom="from-sky-500"
            />
            <PaymentModeCard
              title="UPI Collection"
              baseAmount={data?.paymentModes?.UPI?.baseAmount ?? 0}
              gstAmount={data?.paymentModes?.UPI?.gstAmount ?? 0}
              totalAmount={
                data?.paymentModes?.UPI?.totalAmount ?? (data?.upiAmount || 0)
              }
              icon={QrCode}
              colorClass="text-purple-400"
              badgeBg="bg-purple-500/20"
              borderColor="border-purple-500/30"
              gradientFrom="from-purple-500"
            />
            <PaymentModeCard
              title="Room Transfer"
              baseAmount={data?.paymentModes?.ROOM_TRANSFER?.baseAmount ?? 0}
              gstAmount={data?.paymentModes?.ROOM_TRANSFER?.gstAmount ?? 0}
              totalAmount={
                data?.paymentModes?.ROOM_TRANSFER?.totalAmount ??
                (data?.roomTransferAmount || 0)
              }
              icon={Bed}
              colorClass="text-rose-400"
              badgeBg="bg-rose-500/20"
              borderColor="border-rose-500/30"
              gradientFrom="from-rose-500"
            />
          </div>
        </div>
      )}
    </section>
  );
};
