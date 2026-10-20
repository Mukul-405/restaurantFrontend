import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DateRangeFilter } from '../../common/DateRangeFilter';
import { COLORS, getLocalDateString } from '../../common/dateUtils';
import { getChannelAnalysis, ChannelAnalysis } from '../../../../../lib/analysis';

export const ChannelBreakdownSection: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    end: getLocalDateString(new Date()),
  });
  const [data, setData] = useState<ChannelAnalysis | null>(null);
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
      const result = await getChannelAnalysis(start, end);
      setData(result);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to fetch channel analysis';
      setError(msg);
      console.error('Failed to fetch channel analysis', err);
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
        title="Channel Breakdown"
        dateNote="Check-Out Date"
        icon={Building2}
        iconColor="text-sky-400"
        color={{
          bgLight: 'bg-sky-500/20',
          text: 'text-sky-400',
          bgHover: 'bg-sky-500/30',
          border: 'border-sky-500/50',
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
        <div className="h-32 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {Object.keys(data?.channelBreakdown || {}).length > 0 && (
            <>
              <div className="bg-surface/40 backdrop-blur-md border border-white/10 p-4 sm:p-6 rounded-2xl h-[260px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(data!.channelBreakdown).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.entries(data!.channelBreakdown).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 content-start">
                {Object.entries(data!.channelBreakdown).map(([channel, count], index) => (
                  <div
                    key={channel}
                    className="bg-surface/40 backdrop-blur-md border border-white/10 p-3 sm:p-4 rounded-xl flex flex-col justify-center"
                  >
                    <div className="flex items-center gap-2 mb-1 sm:mb-2">
                      <div
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-slate-400 font-medium text-xs sm:text-sm truncate">{channel}</span>
                    </div>
                    <span className="text-white font-bold text-xl sm:text-2xl">{count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};
