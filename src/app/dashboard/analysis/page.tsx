'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, Receipt, TrendingUp, Users } from 'lucide-react';
import { getRevenueAnalysis, getWaiterAnalysis, RevenueAnalysis, WaiterAnalysis } from '../../../lib/analysis';

const DateRangeFilter = ({ 
  title, icon: Icon, color, iconColor,
  startDate, setStartDate, endDate, setEndDate,
  onGenerate, loading, setDateRangeType
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

    <div className="flex items-center gap-2 flex-wrap -mt-2">
      <button onClick={() => setDateRangeType('today')} className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10">Today</button>
      <button onClick={() => setDateRangeType('yesterday')} className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10">Yesterday</button>
      <button onClick={() => setDateRangeType('7days')} className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10">Last 7 Days</button>
      <button onClick={() => setDateRangeType('month')} className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10">This Month</button>
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
  const [revenueStartDate, setRevenueStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return getLocalDateString(d);
  });
  const [revenueEndDate, setRevenueEndDate] = useState(() => getLocalDateString(new Date()));

  const [waiterStartDate, setWaiterStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return getLocalDateString(d);
  });
  const [waiterEndDate, setWaiterEndDate] = useState(() => getLocalDateString(new Date()));

  const [revenueData, setRevenueData] = useState<RevenueAnalysis | null>(null);
  const [waiterData, setWaiterData] = useState<WaiterAnalysis[]>([]);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [loadingWaiters, setLoadingWaiters] = useState(false);

  const setDateRange = (type: string, setStart: (s: string) => void, setEnd: (s: string) => void, fetchFn: (start: string, end: string) => void) => {
    const today = new Date();
    const end = getLocalDateString(today);
    let start = end;

    if (type === 'today') {
      start = end;
    } else if (type === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      start = getLocalDateString(y);
      setStart(start);
      setEnd(start);
      fetchFn(start, start);
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

    setStart(start);
    setEnd(end);
    fetchFn(start, end);
  };

  const fetchRevenueAnalysis = async (startOverride?: any, endOverride?: any) => {
    const start = typeof startOverride === 'string' ? startOverride : revenueStartDate;
    const end = typeof endOverride === 'string' ? endOverride : revenueEndDate;
    if (!start || !end) return;
    setLoadingRevenue(true);
    try {
      const data = await getRevenueAnalysis(start, end);
      setRevenueData(data);
    } catch (error) {
      console.error('Failed to fetch revenue analysis', error);
    } finally {
      setLoadingRevenue(false);
    }
  };

  const fetchWaiterAnalysis = async (startOverride?: any, endOverride?: any) => {
    const start = typeof startOverride === 'string' ? startOverride : waiterStartDate;
    const end = typeof endOverride === 'string' ? endOverride : waiterEndDate;
    if (!start || !end) return;
    setLoadingWaiters(true);
    try {
      const data = await getWaiterAnalysis(start, end);
      setWaiterData(data);
    } catch (error) {
      console.error('Failed to fetch waiter analysis', error);
    } finally {
      setLoadingWaiters(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
          Analytics Dashboard
        </h1>
        <p className="text-slate-400">Gain insights into your revenue and staff performance.</p>
      </div>

      {/* Revenue Section */}
      <section className="space-y-6">
        <DateRangeFilter 
          title="Revenue Analysis"
          icon={TrendingUp}
          iconColor="text-primary"
          color={{ bgLight: 'bg-primary/20', text: 'text-primary', bgHover: 'bg-primary/30', border: 'border-primary/50' }}
          startDate={revenueStartDate}
          setStartDate={setRevenueStartDate}
          endDate={revenueEndDate}
          setEndDate={setRevenueEndDate}
          onGenerate={() => fetchRevenueAnalysis()}
          loading={loadingRevenue}
          setDateRangeType={(type: string) => setDateRange(type, setRevenueStartDate, setRevenueEndDate, fetchRevenueAnalysis)}
        />

        {loadingRevenue ? (
          <div className="h-32 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Total Base Amount" 
              value={`₹${Number(revenueData?.totalBaseAmount || 0).toFixed(2)}`}
              icon={Receipt}
              color="bg-blue-500"
            />
            <StatCard 
              title="Total GST Amount" 
              value={`₹${Number(revenueData?.totalGstAmount || 0).toFixed(2)}`}
              icon={Receipt}
              color="bg-orange-500"
            />
            <StatCard 
              title="Final Discounted Amount" 
              value={`₹${Number(revenueData?.totalFinalDiscountedAmount || 0).toFixed(2)}`}
              icon={IndianRupee}
              color="bg-emerald-500"
            />
          </div>
        )}
      </section>

      {/* Waiter Analysis Section */}
      <section className="space-y-6 pt-6">
        <DateRangeFilter 
          title="Staff Performance"
          icon={Users}
          iconColor="text-purple-400"
          color={{ bgLight: 'bg-purple-500/20', text: 'text-purple-400', bgHover: 'bg-purple-500/30', border: 'border-purple-500/50' }}
          startDate={waiterStartDate}
          setStartDate={setWaiterStartDate}
          endDate={waiterEndDate}
          setEndDate={setWaiterEndDate}
          onGenerate={() => fetchWaiterAnalysis()}
          loading={loadingWaiters}
          setDateRangeType={(type: string) => setDateRange(type, setWaiterStartDate, setWaiterEndDate, fetchWaiterAnalysis)}
        />

        {loadingWaiters ? (
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
                  {waiterData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        No waiter data found for the selected date range.
                      </td>
                    </tr>
                  ) : (
                    waiterData.map((waiter, index) => (
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
