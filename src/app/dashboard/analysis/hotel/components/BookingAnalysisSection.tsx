import React, { useState } from 'react';
import { Bed, IndianRupee, Calendar, Building2 } from 'lucide-react';
import { DateRangeFilter } from '../../common/DateRangeFilter';
import { StatCard } from '../../common/StatCard';
import { getLocalDateString } from '../../common/dateUtils';
import { getBookingAnalysis, BookingAnalysis } from '../../../../../lib/analysis';
import { downloadBookingReport, printBookingReport } from '../hotelReports';

export const BookingAnalysisSection: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    end: getLocalDateString(new Date()),
  });
  const [data, setData] = useState<BookingAnalysis | null>(null);
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
      const result = await getBookingAnalysis(start, end);
      setData(result);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to fetch booking analysis';
      setError(msg);
      console.error('Failed to fetch booking analysis', err);
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
    <section className="space-y-4 sm:space-y-6">
      <DateRangeFilter
        title="Hotel Bookings & Occupancy"
        dateNote="Check-Out Date"
        icon={Bed}
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
        onDownload={() => downloadBookingReport(data, dateRange)}
        onPrint={() => printBookingReport(data, dateRange)}
        hasData={!!data}
      />

      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <StatCard
            title="Total Room Revenue"
            value={`₹${Number(data?.totalRoomRevenue || 0).toFixed(2)}`}
            icon={IndianRupee}
            color="bg-amber-500"
          />
          <StatCard
            title="Total Bookings"
            value={`${data?.totalBookings || 0}`}
            icon={Calendar}
            color="bg-emerald-500"
          />
          <StatCard
            title="Rooms Sold (Occupancy)"
            value={`${data?.totalRoomsSold || 0}`}
            icon={Building2}
            color="bg-blue-500"
          />
        </div>
      )}
    </section>
  );
};
