import React, { useState } from 'react';
import {
  TrendingUp,
  Receipt,
  IndianRupee,
  Banknote,
  CreditCard,
  QrCode,
  Tag,
  Percent,
  Sparkles,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { DateRangeFilter } from '../../common/DateRangeFilter';
import { StatCard } from '../../common/StatCard';
import { PaymentModeCard } from '../../common/PaymentModeCard';
import { getLocalDateString } from '../../common/dateUtils';
import { getHotelRevenueAnalysis, HotelRevenueAnalysis } from '../../../../../lib/analysis';
import { downloadHotelRevenueReport, printHotelRevenueReport } from '../hotelReports';

export const HotelRevenueSection: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    end: getLocalDateString(new Date()),
  });
  const [data, setData] = useState<HotelRevenueAnalysis | null>(null);
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
      const result = await getHotelRevenueAnalysis(start, end);
      setData(result);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to fetch hotel revenue analysis';
      setError(msg);
      console.error('Failed to fetch hotel revenue analysis', err);
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

  const formatINR = (val?: number) =>
    `₹${Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <section className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 border-t border-white/5">
      <DateRangeFilter
        title="Hotel Revenue Analysis"
        dateNote="Check-Out Date"
        icon={TrendingUp}
        iconColor="text-amber-400"
        color={{
          bgLight: 'bg-amber-500/20',
          text: 'text-amber-400',
          bgHover: 'bg-amber-500/30',
          border: 'border-amber-500/50',
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
        onDownload={() => downloadHotelRevenueReport(data, dateRange)}
        onPrint={() => printHotelRevenueReport(data, dateRange)}
        hasData={!!data}
      />

      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Summary Stat Cards - 2 Rows of 4 Cards on Desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            <StatCard
              title="Base Amount"
              value={formatINR(data?.baseAmount)}
              icon={Receipt}
              color="bg-blue-500"
            />
            <StatCard
              title="Tax Amount"
              value={formatINR(data?.taxAmount)}
              icon={Receipt}
              color="bg-orange-500"
            />
            <StatCard
              title="Total (Base + Tax)"
              value={formatINR(data?.totalAmount)}
              icon={IndianRupee}
              color="bg-amber-500"
            />
            <StatCard
              title="Room Discount"
              value={formatINR(data?.roomDiscountAmount)}
              icon={Tag}
              color="bg-rose-500"
            />
            <StatCard
              title="Commission"
              value={formatINR(data?.commission)}
              icon={Percent}
              color="bg-purple-500"
            />
            <StatCard
              title="TCS Tax"
              value={formatINR(data?.tcs)}
              icon={ShieldCheck}
              color="bg-yellow-500"
            />
            <StatCard
              title="TDS Tax"
              value={formatINR(data?.tds)}
              icon={FileText}
              color="bg-teal-500"
            />
            <StatCard
              title="Final Settled Sales"
              value={formatINR(data?.finalAmount)}
              icon={Sparkles}
              color="bg-emerald-500"
              highlight={true}
            />
          </div>

          {/* Payment Mode Cards (Cash, Card, UPI) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <PaymentModeCard
              title="Cash Collection"
              count={data?.paymentModes?.CASH?.count ?? 0}
              baseAmount={data?.paymentModes?.CASH?.baseAmount ?? 0}
              gstAmount={data?.paymentModes?.CASH?.taxAmount ?? 0}
              totalAmount={data?.paymentModes?.CASH?.totalAmount ?? 0}
              commission={data?.paymentModes?.CASH?.commission ?? 0}
              roomDiscountAmount={data?.paymentModes?.CASH?.roomDiscountAmount ?? 0}
              tds={data?.paymentModes?.CASH?.tds ?? 0}
              tcs={data?.paymentModes?.CASH?.tcs ?? 0}
              finalAmount={data?.paymentModes?.CASH?.finalAmount ?? 0}
              taxLabel="Tax Amount"
              icon={Banknote}
              colorClass="text-emerald-400"
              badgeBg="bg-emerald-500/20"
              borderColor="border-emerald-500/30"
              gradientFrom="from-emerald-500"
            />
            <PaymentModeCard
              title="Card Collection"
              count={data?.paymentModes?.CARD?.count ?? 0}
              baseAmount={data?.paymentModes?.CARD?.baseAmount ?? 0}
              gstAmount={data?.paymentModes?.CARD?.taxAmount ?? 0}
              totalAmount={data?.paymentModes?.CARD?.totalAmount ?? 0}
              commission={data?.paymentModes?.CARD?.commission ?? 0}
              roomDiscountAmount={data?.paymentModes?.CARD?.roomDiscountAmount ?? 0}
              tds={data?.paymentModes?.CARD?.tds ?? 0}
              tcs={data?.paymentModes?.CARD?.tcs ?? 0}
              finalAmount={data?.paymentModes?.CARD?.finalAmount ?? 0}
              taxLabel="Tax Amount"
              icon={CreditCard}
              colorClass="text-sky-400"
              badgeBg="bg-sky-500/20"
              borderColor="border-sky-500/30"
              gradientFrom="from-sky-500"
            />
            <PaymentModeCard
              title="UPI Collection"
              count={data?.paymentModes?.UPI?.count ?? 0}
              baseAmount={data?.paymentModes?.UPI?.baseAmount ?? 0}
              gstAmount={data?.paymentModes?.UPI?.taxAmount ?? 0}
              totalAmount={data?.paymentModes?.UPI?.totalAmount ?? 0}
              commission={data?.paymentModes?.UPI?.commission ?? 0}
              roomDiscountAmount={data?.paymentModes?.UPI?.roomDiscountAmount ?? 0}
              tds={data?.paymentModes?.UPI?.tds ?? 0}
              tcs={data?.paymentModes?.UPI?.tcs ?? 0}
              finalAmount={data?.paymentModes?.UPI?.finalAmount ?? 0}
              taxLabel="Tax Amount"
              icon={QrCode}
              colorClass="text-purple-400"
              badgeBg="bg-purple-500/20"
              borderColor="border-purple-500/30"
              gradientFrom="from-purple-500"
            />
          </div>
        </div>
      )}
    </section>
  );
};
