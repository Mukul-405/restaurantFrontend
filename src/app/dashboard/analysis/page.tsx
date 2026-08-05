'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, Receipt, TrendingUp, Users, Bed, Building2, Calendar, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getRevenueAnalysis, getWaiterAnalysis, getBookingAnalysis, getChannelAnalysis, RevenueAnalysis, WaiterAnalysis, BookingAnalysis, ChannelAnalysis } from '../../../lib/analysis';

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#6366f1'];

const DateRangeFilter = ({ 
  title, icon: Icon, color, iconColor,
  startDate, setStartDate, endDate, setEndDate,
  onGenerate, loading, setDateRangeType, error
}: any) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between flex-wrap gap-4 bg-surface/30 p-4 rounded-xl border border-white/5">
      <div className="flex items-center gap-3">
        <Icon className={iconColor} size={24} />
        <h2 className="text-xl font-semibold text-slate-200">{title}</h2>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Start:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            onClick={(e) => (e.target as any).showPicker?.()}
            className="bg-surface/50 border border-white/10 text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 transition-all outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">End:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            onClick={(e) => (e.target as any).showPicker?.()}
            className="bg-surface/50 border border-white/10 text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 transition-all outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50"
          />
        </div>
        <button
          onClick={onGenerate}
          disabled={loading}
          className={`px-4 py-2 ${color.bgLight} ${color.text} hover:${color.bgHover} border ${color.border} rounded-lg text-sm font-medium transition-all disabled:opacity-50`}
        >
          Generate
        </button>
      </div>
    </div>

    <div className="flex items-center justify-between gap-2 flex-wrap -mt-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setDateRangeType('today')} className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10">Today</button>
        <button onClick={() => setDateRangeType('yesterday')} className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10">Yesterday</button>
        <button onClick={() => setDateRangeType('7days')} className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10">Last 7 Days</button>
        <button onClick={() => setDateRangeType('month')} className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10">This Month</button>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-medium"
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </motion.div>
      )}
    </div>
  </div>
);

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string, icon: any, color: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative overflow-hidden bg-surface/40 backdrop-blur-md p-6 rounded-2xl border border-white/10`}
  >
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${color} blur-2xl`} />
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-slate-400 font-medium">{title}</h3>
      <div className={`p-2 rounded-xl bg-surface/50 ${color.replace('bg-', 'text-')}`}>
        <Icon size={20} />
      </div>
    </div>
    <div className="text-3xl font-bold text-white tracking-tight">
      {value}
    </div>
  </motion.div>
);

const getLocalDateString = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AnalysisPage() {
  const [dateRanges, setDateRanges] = useState({
    booking: { start: getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), end: getLocalDateString(new Date()) },
    channel: { start: getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), end: getLocalDateString(new Date()) },
    revenue: { start: getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), end: getLocalDateString(new Date()) },
    waiter: { start: getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), end: getLocalDateString(new Date()) },
  });

  const [data, setData] = useState({
    revenue: null as RevenueAnalysis | null,
    waiter: [] as WaiterAnalysis[],
    booking: null as BookingAnalysis | null,
    channel: null as ChannelAnalysis | null,
  });

  const [loading, setLoading] = useState({
    revenue: false, waiter: false, booking: false, channel: false
  });

  const [errors, setErrors] = useState<{ [key: string]: string | null }>({
    booking: null,
    channel: null,
    revenue: null,
    waiter: null,
  });

  const updateDateRange = (section: keyof typeof dateRanges, field: 'start' | 'end', value: string) => {
    setDateRanges(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    setErrors(prev => ({ ...prev, [section]: null }));
  };

  const setPresetDateRange = (
    type: string, 
    section: keyof typeof dateRanges, 
    apiCall: (s: string, e: string) => Promise<any>
  ) => {
    setErrors(prev => ({ ...prev, [section]: null }));
    const today = new Date();
    const end = getLocalDateString(today);
    let start = end;

    if (type === 'yesterday') {
      const y = new Date(); y.setDate(y.getDate() - 1);
      start = getLocalDateString(y);
      setDateRanges(prev => ({ ...prev, [section]: { start, end: start } }));
      fetchData(section, apiCall, start, start);
      return;
    } else if (type === '7days') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      start = getLocalDateString(d);
    } else if (type === 'month') {
      const d = new Date(); d.setDate(1);
      start = getLocalDateString(d);
    }

    setDateRanges(prev => ({ ...prev, [section]: { start, end } }));
    fetchData(section, apiCall, start, end);
  };

  const fetchData = async (
    section: keyof typeof dateRanges, 
    apiCall: (s: string, e: string) => Promise<any>,
    overrideStart?: string,
    overrideEnd?: string
  ) => {
    const start = overrideStart ?? dateRanges[section].start;
    const end = overrideEnd ?? dateRanges[section].end;
    if (!start || !end) return;

    const startD = new Date(start);
    const endD = new Date(end);
    if (endD.getTime() - startD.getTime() > 365 * 24 * 60 * 60 * 1000) {
      setErrors(prev => ({ ...prev, [section]: 'Date range cannot exceed 1 year. Please select a smaller range.' }));
      return;
    }

    setErrors(prev => ({ ...prev, [section]: null }));
    setLoading(prev => ({ ...prev, [section]: true }));
    try {
      const result = await apiCall(start, end);
      setData(prev => ({ ...prev, [section]: result }));
    } catch (error: any) {
      const msg = error.response?.data?.error || `Failed to fetch ${section} analysis`;
      setErrors(prev => ({ ...prev, [section]: msg }));
      console.error(`Failed to fetch ${section} analysis`, error);
    } finally {
      setLoading(prev => ({ ...prev, [section]: false }));
    }
  };

  const fetchBookingAnalysis = () => fetchData('booking', getBookingAnalysis);
  const fetchChannelAnalysis = () => fetchData('channel', getChannelAnalysis);
  const fetchRevenueAnalysis = () => fetchData('revenue', getRevenueAnalysis);
  const fetchWaiterAnalysis = () => fetchData('waiter', getWaiterAnalysis);

  // Intentionally not fetching data on mount. Data should only be fetched when explicitly requested.

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
          Analytics Dashboard
        </h1>
        <p className="text-slate-400">Gain insights into your revenue and staff performance.</p>
      </div>

      {/* Booking Analysis Section */}
      <section className="space-y-6">
        <DateRangeFilter 
          title="Hotel Bookings & Occupancy"
          icon={Bed}
          iconColor="text-amber-400"
          color={{ bgLight: 'bg-amber-500/20', text: 'text-amber-400', bgHover: 'bg-amber-500/30', border: 'border-amber-500/50' }}
          startDate={dateRanges.booking.start}
          setStartDate={(v: string) => updateDateRange('booking', 'start', v)}
          endDate={dateRanges.booking.end}
          setEndDate={(v: string) => updateDateRange('booking', 'end', v)}
          onGenerate={fetchBookingAnalysis}
          loading={loading.booking}
          setDateRangeType={(type: string) => setPresetDateRange(type, 'booking', getBookingAnalysis)}
          error={errors.booking}
        />

        {loading.booking ? (
          <div className="h-32 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Total Room Revenue"
              value={`₹${Number(data.booking?.totalRoomRevenue || 0).toFixed(2)}`}
              icon={IndianRupee}
              color="bg-amber-500"
            />
            <StatCard 
              title="Total Bookings"
              value={`${data.booking?.totalBookings || 0}`}
              icon={Calendar}
              color="bg-emerald-500"
            />
            <StatCard 
              title="Rooms Sold (Occupancy)"
              value={`${data.booking?.totalRoomsSold || 0}`}
              icon={Building2}
              color="bg-blue-500"
            />
          </div>
        )}
      </section>

      {/* Channel Breakdown Section */}
      <section className="space-y-6 pt-6 border-t border-white/5">
        <DateRangeFilter 
          title="Channel Breakdown"
          icon={Building2}
          iconColor="text-sky-400"
          color={{ bgLight: 'bg-sky-500/20', text: 'text-sky-400', bgHover: 'bg-sky-500/30', border: 'border-sky-500/50' }}
          startDate={dateRanges.channel.start}
          setStartDate={(v: string) => updateDateRange('channel', 'start', v)}
          endDate={dateRanges.channel.end}
          setEndDate={(v: string) => updateDateRange('channel', 'end', v)}
          onGenerate={fetchChannelAnalysis}
          loading={loading.channel}
          setDateRangeType={(type: string) => setPresetDateRange(type, 'channel', getChannelAnalysis)}
          error={errors.channel}
        />

        {loading.channel ? (
          <div className="h-32 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.keys(data.channel?.channelBreakdown || {}).length > 0 && (
              <>
                <div className="bg-surface/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(data.channel!.channelBreakdown).map(([name, value]) => ({ name, value }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {Object.entries(data.channel!.channelBreakdown).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 content-start">
                  {Object.entries(data.channel!.channelBreakdown).map(([channel, count], index) => (
                    <div key={channel} className="bg-surface/40 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-slate-400 font-medium text-sm">{channel}</span>
                      </div>
                      <span className="text-white font-bold text-2xl">{count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* Revenue Section */}
      <section className="space-y-6 pt-6 border-t border-white/5">
        <DateRangeFilter 
          title="Revenue Analysis"
          icon={TrendingUp}
          iconColor="text-primary"
          color={{ bgLight: 'bg-primary/20', text: 'text-primary', bgHover: 'bg-primary/30', border: 'border-primary/50' }}
          startDate={dateRanges.revenue.start}
          setStartDate={(v: string) => updateDateRange('revenue', 'start', v)}
          endDate={dateRanges.revenue.end}
          setEndDate={(v: string) => updateDateRange('revenue', 'end', v)}
          onGenerate={fetchRevenueAnalysis}
          loading={loading.revenue}
          setDateRangeType={(type: string) => setPresetDateRange(type, 'revenue', getRevenueAnalysis)}
          error={errors.revenue}
        />

        {loading.revenue ? (
          <div className="h-32 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Total Base Amount" 
              value={`₹${Number(data.revenue?.totalBaseAmount || 0).toFixed(2)}`}
              icon={Receipt}
              color="bg-blue-500"
            />
            <StatCard 
              title="Total GST Amount" 
              value={`₹${Number(data.revenue?.totalGstAmount || 0).toFixed(2)}`}
              icon={Receipt}
              color="bg-orange-500"
            />
            <StatCard 
              title="Final Discounted Amount" 
              value={`₹${Number(data.revenue?.totalFinalDiscountedAmount || 0).toFixed(2)}`}
              icon={IndianRupee}
              color="bg-emerald-500"
            />
          </div>
        )}
      </section>

      {/* Waiter Analysis Section */}
      <section className="space-y-6 pt-6 border-t border-white/5">
        <DateRangeFilter 
          title="Staff Performance"
          icon={Users}
          iconColor="text-purple-400"
          color={{ bgLight: 'bg-purple-500/20', text: 'text-purple-400', bgHover: 'bg-purple-500/30', border: 'border-purple-500/50' }}
          startDate={dateRanges.waiter.start}
          setStartDate={(v: string) => updateDateRange('waiter', 'start', v)}
          endDate={dateRanges.waiter.end}
          setEndDate={(v: string) => updateDateRange('waiter', 'end', v)}
          onGenerate={fetchWaiterAnalysis}
          loading={loading.waiter}
          setDateRangeType={(type: string) => setPresetDateRange(type, 'waiter', getWaiterAnalysis)}
          error={errors.waiter}
        />

        {loading.waiter ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-surface/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-black/20">
                  <tr>
                    <th scope="col" className="px-6 py-4">Waiter Name</th>
                    <th scope="col" className="px-6 py-4">Phone Number</th>
                    <th scope="col" className="px-6 py-4 text-center">Total Orders</th>
                    <th scope="col" className="px-6 py-4 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.waiter.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        No waiter data found for the selected date range.
                      </td>
                    </tr>
                  ) : (
                    data.waiter.map((waiter, index) => (
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
        )}
      </section>
    </div>
  );
}
