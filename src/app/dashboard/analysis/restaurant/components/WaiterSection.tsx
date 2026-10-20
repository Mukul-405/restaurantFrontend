import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { DateRangeFilter } from '../../common/DateRangeFilter';
import { getLocalDateString } from '../../common/dateUtils';
import { getWaiterAnalysis, WaiterAnalysis } from '../../../../../lib/analysis';

export const WaiterSection: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    end: getLocalDateString(new Date()),
  });
  const [data, setData] = useState<WaiterAnalysis[]>([]);
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
      const result = await getWaiterAnalysis(start, end);
      setData(result || []);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to fetch waiter analysis';
      setError(msg);
      console.error('Failed to fetch waiter analysis', err);
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
        title="Staff Performance"
        icon={Users}
        iconColor="text-purple-400"
        color={{
          bgLight: 'bg-purple-500/20',
          text: 'text-purple-400',
          bgHover: 'bg-purple-500/30',
          border: 'border-purple-500/50',
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
      />

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Mobile View for Waiter */}
          <div className="block md:hidden space-y-2.5">
            {data.length === 0 ? (
              <div className="bg-surface/40 backdrop-blur-md rounded-2xl border border-white/10 p-8 text-center text-slate-500 text-sm">
                No waiter data found for the selected date range.
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto custom-scrollbar space-y-2.5 pr-1">
                {data.map((waiter, index) => (
                  <motion.div
                    key={waiter.userId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-surface/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center justify-between gap-3 shadow-md"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {waiter.waiterName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm truncate">{waiter.waiterName}</h4>
                        <p className="text-xs text-slate-400">{waiter.phoneNumber}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-emerald-400 font-bold text-sm font-mono block">
                        ₹{Number(waiter.totalRevenue || 0).toFixed(2)}
                      </span>
                      <span className="bg-white/10 text-white px-2 py-0.5 rounded-full text-[10px] font-medium inline-block mt-0.5">
                        {waiter.totalOrders} orders
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop View for Waiter */}
          <div className="hidden md:block bg-surface/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm text-left text-slate-300 min-w-[500px] relative">
                <thead className="text-xs text-slate-400 uppercase bg-black/70 backdrop-blur-md sticky top-0 z-10 border-b border-white/10">
                  <tr>
                    <th scope="col" className="px-6 py-4">Waiter Name</th>
                    <th scope="col" className="px-6 py-4">Phone Number</th>
                    <th scope="col" className="px-6 py-4 text-center">Total Orders</th>
                    <th scope="col" className="px-6 py-4 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        No waiter data found for the selected date range.
                      </td>
                    </tr>
                  ) : (
                    data.map((waiter, index) => (
                      <motion.tr
                        key={waiter.userId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                            {waiter.waiterName.charAt(0).toUpperCase()}
                          </div>
                          {waiter.waiterName}
                        </td>
                        <td className="px-6 py-4">
                          {waiter.phoneNumber}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-white/10 text-white px-2.5 py-1 rounded-full font-medium">
                            {waiter.totalOrders}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-emerald-400">
                          ₹{Number(waiter.totalRevenue || 0).toFixed(2)}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
