'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IndianRupee, Receipt, TrendingUp, Users, Bed, Building2, Calendar, 
  AlertCircle, Banknote, CreditCard, QrCode, Download, Printer, 
  UtensilsCrossed, ShoppingBag, Search, ArrowUpDown, Sparkles, Hotel,
  FileSpreadsheet, CheckCircle2, XCircle, FileText, Check, Layers
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  getRevenueAnalysis, getWaiterAnalysis, getBookingAnalysis, getChannelAnalysis, getOrderItemAnalysis, getDailyBillSummary,
  RevenueAnalysis, WaiterAnalysis, BookingAnalysis, ChannelAnalysis, OrderItemAnalysis, DailyBillSummaryResult, DailyBillSummaryItem, DayGroupSummary
} from '../../../lib/analysis';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { printHtml } from '../../../utils/printReceipt';
import { escapeHtml } from '../../../utils/escapeHtml';

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#6366f1'];

const DateRangeFilter = ({
  title, icon: Icon, color, iconColor,
  startDate, setStartDate, endDate, setEndDate,
  onGenerate, loading, setDateRangeType, error, onDownload, onPrint, hasData,
  dateNote
}: any) => (
  <div className="space-y-4">
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface/30 p-4 sm:p-5 rounded-2xl border border-white/5 shadow-md">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${color.bgLight} ${iconColor} border ${color.border} shrink-0`}>
          <Icon size={20} className="sm:w-5 sm:h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-xl font-bold text-slate-100">{title}</h2>
            {dateNote && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                {dateNote}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
            <label className="text-[11px] sm:text-xs text-slate-400 font-medium">Start:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onClick={(e) => (e.target as any).showPicker?.()}
              className="w-full sm:w-auto bg-surface/50 border border-white/10 text-white text-xs sm:text-sm rounded-lg focus:ring-primary focus:border-primary p-2 sm:p-2.5 transition-all outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
            <label className="text-[11px] sm:text-xs text-slate-400 font-medium">End:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              onClick={(e) => (e.target as any).showPicker?.()}
              className="w-full sm:w-auto bg-surface/50 border border-white/10 text-white text-xs sm:text-sm rounded-lg focus:ring-primary focus:border-primary p-2 sm:p-2.5 transition-all outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-1 sm:pt-0">
          {hasData && (
            <>
              {onPrint && (
                <button
                  onClick={onPrint}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 text-white hover:bg-white/10 border border-white/10 rounded-lg text-xs sm:text-sm font-medium transition-all"
                  title="Print Report"
                >
                  <Printer size={15} />
                  <span>Print</span>
                </button>
              )}
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 text-white hover:bg-white/10 border border-white/10 rounded-lg text-xs sm:text-sm font-medium transition-all"
                  title="Download PDF"
                >
                  <Download size={15} />
                  <span>PDF</span>
                </button>
              )}
            </>
          )}
          <button
            onClick={onGenerate}
            disabled={loading}
            className={`w-full sm:w-auto px-5 py-2 ${color.bgLight} ${color.text} hover:${color.bgHover} border ${color.border} rounded-lg text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center shadow-sm`}
          >
            {loading ? 'Loading...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 -mt-2">
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2">
        <button onClick={() => setDateRangeType('today')} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10 text-center">Today</button>
        <button onClick={() => setDateRangeType('yesterday')} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10 text-center">Yesterday</button>
        <button onClick={() => setDateRangeType('7days')} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10 text-center">Last 7 Days</button>
        <button onClick={() => setDateRangeType('month')} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10 text-center">This Month</button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-medium"
        >
          <AlertCircle size={14} className="shrink-0" />
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
    className="relative overflow-hidden bg-surface/40 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-white/10 shadow-lg"
  >
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${color} blur-2xl pointer-events-none`} />
    <div className="flex justify-between items-start mb-3 sm:mb-4">
      <h3 className="text-slate-400 font-medium text-xs sm:text-sm">{title}</h3>
      <div className={`p-2 rounded-xl bg-surface/50 ${color.replace('bg-', 'text-')}`}>
        <Icon size={18} className="sm:w-5 sm:h-5" />
      </div>
    </div>
    <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
      {value}
    </div>
  </motion.div>
);

const PaymentModeCard = ({
  title,
  baseAmount,
  gstAmount,
  totalAmount,
  icon: Icon,
  colorClass,
  badgeBg,
  borderColor,
  gradientFrom
}: {
  title: string;
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  icon: any;
  colorClass: string;
  badgeBg: string;
  borderColor: string;
  gradientFrom: string;
}) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.01 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative overflow-hidden bg-surface/40 backdrop-blur-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl border ${borderColor} flex flex-col justify-between space-y-4 sm:space-y-5 hover:shadow-2xl transition-all duration-300 group`}
  >
    <div className={`absolute -right-20 -top-20 w-48 h-48 bg-gradient-to-br ${gradientFrom} to-transparent opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity duration-500 pointer-events-none`} />

    <div className="relative z-10 flex justify-between items-start">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl ${badgeBg} shadow-inner`}>
          <Icon size={20} className={`${colorClass} sm:w-6 sm:h-6`} />
        </div>
        <div>
          <h3 className="text-white font-bold text-sm sm:text-base tracking-wide">{title}</h3>
          <span className={`${colorClass} text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-80`}>Payment Mode</span>
        </div>
      </div>
    </div>

    <div className="relative z-10 space-y-0.5">
      <span className="text-[11px] sm:text-xs text-slate-400 font-medium tracking-wide">Total (Base + GST)</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-lg sm:text-xl font-bold ${colorClass} opacity-80`}>₹</span>
        <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">{Number(totalAmount || 0).toFixed(2)}</span>
      </div>
    </div>

    <div className="relative z-10 pt-3 sm:pt-4 border-t border-white/10 grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
      <div className="bg-black/30 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
        <span className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider block mb-0.5 sm:mb-1">Base Amount</span>
        <span className="text-slate-200 font-bold text-xs sm:text-sm">₹{Number(baseAmount || 0).toFixed(2)}</span>
      </div>
      <div className="bg-black/30 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
        <span className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider block mb-0.5 sm:mb-1">GST (5%)</span>
        <span className="text-amber-400/90 font-bold text-xs sm:text-sm">₹{Number(gstAmount || 0).toFixed(2)}</span>
      </div>
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
  const [activeCategory, setActiveCategory] = useState<'HOTEL' | 'RESTAURANT'>('HOTEL');

  const [dateRanges, setDateRanges] = useState({
    booking: { start: getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), end: getLocalDateString(new Date()) },
    channel: { start: getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), end: getLocalDateString(new Date()) },
    revenue: { start: getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), end: getLocalDateString(new Date()) },
    orderItem: { start: getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), end: getLocalDateString(new Date()) },
    waiter: { start: getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), end: getLocalDateString(new Date()) },
    dailyBills: { start: getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), end: getLocalDateString(new Date()) },
  });

  const [data, setData] = useState({
    revenue: null as RevenueAnalysis | null,
    waiter: [] as WaiterAnalysis[],
    booking: null as BookingAnalysis | null,
    channel: null as ChannelAnalysis | null,
    orderItem: null as OrderItemAnalysis | null,
    dailyBills: null as DailyBillSummaryResult | null,
  });

  const [loading, setLoading] = useState({
    revenue: false, waiter: false, booking: false, channel: false, orderItem: false, dailyBills: false
  });

  const [errors, setErrors] = useState<{ [key: string]: string | null }>({
    booking: null,
    channel: null,
    revenue: null,
    waiter: null,
    orderItem: null,
    dailyBills: null,
  });

  // Local filter & sorting for Order Items table
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [itemSortBy, setItemSortBy] = useState<'quantity' | 'amount' | 'name'>('quantity');

  // Local filter for Daily Bill Summary table
  const [dailyBillSearch, setDailyBillSearch] = useState('');
  const [dailyBillStatusFilter, setDailyBillStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [dailyBillPaymentFilter, setDailyBillPaymentFilter] = useState<string>('ALL');

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
  const fetchOrderItemAnalysis = () => fetchData('orderItem', getOrderItemAnalysis);
  const fetchWaiterAnalysis = () => fetchData('waiter', getWaiterAnalysis);
  const fetchDailyBillSummary = () => fetchData('dailyBills', getDailyBillSummary);

  const generateBookingPDF = () => {
    if (!data.booking) return null;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Hotel Bookings & Occupancy Report`, 14, 22);
    doc.setFontSize(10);
    doc.text(`Filtered by Check-Out Date | Period: ${dateRanges.booking.start} to ${dateRanges.booking.end}`, 14, 30);

    autoTable(doc, {
      startY: 40,
      head: [['Metric', 'Value']],
      body: [
        ['Total Room Revenue', `INR ${data.booking.totalRoomRevenue.toFixed(2)}`],
        ['Total Bookings', data.booking.totalBookings.toString()],
        ['Rooms Sold (Occupancy)', data.booking.totalRoomsSold.toString()]
      ]
    });
    return doc;
  };

  const generateRevenuePDF = () => {
    if (!data.revenue) return null;
    const doc = new jsPDF();
    const rev = data.revenue;
    const cash = rev.paymentModes?.CASH || { count: 0, baseAmount: 0, gstAmount: 0, totalAmount: 0 };
    const card = rev.paymentModes?.CARD || { count: 0, baseAmount: 0, gstAmount: 0, totalAmount: 0 };
    const upi = rev.paymentModes?.UPI || { count: 0, baseAmount: 0, gstAmount: 0, totalAmount: 0 };
    const roomTransfer = rev.paymentModes?.ROOM_TRANSFER || { count: 0, baseAmount: 0, gstAmount: 0, totalAmount: 0 };

    const totalOrders = rev.totalOrders || 0;
    const dineInCount = totalOrders - roomTransfer.count;
    const dineInBase = rev.totalBaseAmount - roomTransfer.baseAmount;
    const dineInTax = rev.totalGstAmount - roomTransfer.gstAmount;
    const dineInTotal = rev.totalFinalDiscountedAmount - roomTransfer.totalAmount;

    const totalPaymentsBase = cash.baseAmount + card.baseAmount + upi.baseAmount;
    const totalPaymentsTax = cash.gstAmount + card.gstAmount + upi.gstAmount;
    const totalPaymentsTotal = cash.totalAmount + card.totalAmount + upi.totalAmount;
    const totalPaymentsCount = cash.count + card.count + upi.count;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text('Sales & Revenue Summary Report', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Period: ${dateRanges.revenue.start} to ${dateRanges.revenue.end}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

    let currentY = 40;

    // 1. Overall Sales Summary
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('1. Sales Summary', 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      head: [['Metric', 'Amount (INR)']],
      body: [
        ['Total Orders Completed', totalOrders.toString()],
        ['Total Discount', `INR ${Number(rev.totalDiscountAmount || 0).toFixed(2)}`],
        ['Net Sales (Base Amount)', `INR ${Number(rev.totalBaseAmount || 0).toFixed(2)}`],
        ['Total Tax (5% GST)', `INR ${Number(rev.totalGstAmount || 0).toFixed(2)}`],
        ['Total Settled Sales', `INR ${Number(rev.totalFinalDiscountedAmount || 0).toFixed(2)}`],
      ],
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // 2. Order Type Breakdown
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('2. Order Type Breakdown', 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      head: [['Order Type', 'Base Amount (INR)', 'CGST (2.5%)', 'SGST (2.5%)', 'Total Amount (INR)']],
      body: [
        [
          `DINE IN (${dineInCount})`,
          Number(dineInBase).toFixed(2),
          Number(dineInTax / 2).toFixed(2),
          Number(dineInTax / 2).toFixed(2),
          Number(dineInTotal).toFixed(2)
        ],
        [
          `ROOM SERVICE (${roomTransfer.count})`,
          Number(roomTransfer.baseAmount).toFixed(2),
          Number(roomTransfer.gstAmount / 2).toFixed(2),
          Number(roomTransfer.gstAmount / 2).toFixed(2),
          Number(roomTransfer.totalAmount).toFixed(2)
        ]
      ],
      foot: [
        [
          `Total (${totalOrders})`,
          Number(rev.totalBaseAmount).toFixed(2),
          Number(rev.totalGstAmount / 2).toFixed(2),
          Number(rev.totalGstAmount / 2).toFixed(2),
          Number(rev.totalFinalDiscountedAmount).toFixed(2)
        ]
      ],
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // 3. Payment Mode Collection Breakdown
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('3. Payment Mode Collection Summary', 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      head: [['Payment Mode', 'Count', 'Base Amount (INR)', 'CGST (2.5%)', 'SGST (2.5%)', 'Total Amount (INR)']],
      body: [
        [
          'CASH',
          cash.count.toString(),
          Number(cash.baseAmount).toFixed(2),
          Number(cash.gstAmount / 2).toFixed(2),
          Number(cash.gstAmount / 2).toFixed(2),
          Number(cash.totalAmount).toFixed(2)
        ],
        [
          'CARD',
          card.count.toString(),
          Number(card.baseAmount).toFixed(2),
          Number(card.gstAmount / 2).toFixed(2),
          Number(card.gstAmount / 2).toFixed(2),
          Number(card.totalAmount).toFixed(2)
        ],
        [
          'UPI',
          upi.count.toString(),
          Number(upi.baseAmount).toFixed(2),
          Number(upi.gstAmount / 2).toFixed(2),
          Number(upi.gstAmount / 2).toFixed(2),
          Number(upi.totalAmount).toFixed(2)
        ],
      ],
      foot: [
        [
          'Total Direct Payments',
          totalPaymentsCount.toString(),
          Number(totalPaymentsBase).toFixed(2),
          Number(totalPaymentsTax / 2).toFixed(2),
          Number(totalPaymentsTax / 2).toFixed(2),
          Number(totalPaymentsTotal).toFixed(2)
        ]
      ],
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // 4. Room Transfers (Unsettled / Settled at Checkout)
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('4. Transferred to Room (To Be Settled at Hotel Checkout)', 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [244, 63, 94], textColor: [255, 255, 255], fontStyle: 'bold' },
      head: [['Category', 'Count', 'Base Amount (INR)', 'CGST (2.5%)', 'SGST (2.5%)', 'Total Amount (INR)']],
      body: [
        [
          'ROOM TRANSFER',
          roomTransfer.count.toString(),
          Number(roomTransfer.baseAmount).toFixed(2),
          Number(roomTransfer.gstAmount / 2).toFixed(2),
          Number(roomTransfer.gstAmount / 2).toFixed(2),
          Number(roomTransfer.totalAmount).toFixed(2)
        ]
      ],
    });

    return doc;
  };

  const generateOrderItemPDF = () => {
    if (!data.orderItem) return null;
    const doc = new jsPDF();
    const oi = data.orderItem;

    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text('Restaurant Order Items Analysis Report (Excl. GST)', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Period: ${dateRanges.orderItem.start} to ${dateRanges.orderItem.end}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

    let currentY = 42;

    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('1. Executive Summary (Excl. GST)', 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      head: [['Metric', 'Value']],
      body: [
        ['Total Items Sold (Qty)', oi.totalItemsSold.toString()],
        ['Total Unique Dishes Ordered', oi.totalUniqueItems.toString()],
        ['Total Base Amount (Excl. GST)', `INR ${Number(oi.totalAmountExcludingGst || 0).toFixed(2)}`],
      ],
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('2. Ordered Items Breakdown', 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      head: [['#', 'Item Name', 'Qty Sold', 'Unit Price (Excl. GST)', 'Total Base Amount (INR)']],
      body: oi.items.map((item, idx) => [
        (idx + 1).toString(),
        item.name,
        item.totalQuantity.toString(),
        `INR ${Number(item.price || 0).toFixed(2)}`,
        `INR ${Number(item.totalAmount || 0).toFixed(2)}`,
      ]),
      foot: [
        [
          'Total',
          `${oi.totalUniqueItems} Unique Items`,
          oi.totalItemsSold.toString(),
          '-',
          `INR ${Number(oi.totalAmountExcludingGst || 0).toFixed(2)}`,
        ],
      ],
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    });

    return doc;
  };

  const downloadBookingReport = () => {
    const doc = generateBookingPDF();
    if (doc) doc.save(`bookings-${dateRanges.booking.start}-to-${dateRanges.booking.end}.pdf`);
  };

  const printBookingReport = () => {
    if (!data.booking) return;
    const b = data.booking;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hotel Bookings & Occupancy Report</title>
          <style>
            @page { margin: 12mm 10mm; size: A4 portrait; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; font-size: 13px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
            .subtitle { color: #64748b; font-size: 12px; margin: 0; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
            .card-title { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }
            .card-val { font-size: 18px; font-weight: 800; color: #0f172a; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Sunrise Resorts - Hotel Bookings & Occupancy Report</h1>
            <p class="subtitle">Filtered by Check-Out Date | Period: ${dateRanges.booking.start} to ${dateRanges.booking.end} | Generated: ${new Date().toLocaleString()}</p>
          </div>
          <div class="grid">
            <div class="card"><div class="card-title">Total Room Revenue</div><div class="card-val">INR ${Number(b.totalRoomRevenue || 0).toFixed(2)}</div></div>
            <div class="card"><div class="card-title">Total Bookings</div><div class="card-val">${b.totalBookings || 0}</div></div>
            <div class="card"><div class="card-title">Rooms Sold (Occupancy)</div><div class="card-val">${b.totalRoomsSold || 0}</div></div>
          </div>
        </body>
      </html>
    `;
    printHtml(html);
  };

  const downloadRevenueReport = () => {
    const doc = generateRevenuePDF();
    if (doc) doc.save(`revenue-${dateRanges.revenue.start}-to-${dateRanges.revenue.end}.pdf`);
  };

  const printRevenueReport = () => {
    if (!data.revenue) return;
    const rev = data.revenue;
    const cash = rev.paymentModes?.CASH || { count: 0, baseAmount: 0, gstAmount: 0, totalAmount: 0 };
    const card = rev.paymentModes?.CARD || { count: 0, baseAmount: 0, gstAmount: 0, totalAmount: 0 };
    const upi = rev.paymentModes?.UPI || { count: 0, baseAmount: 0, gstAmount: 0, totalAmount: 0 };
    const roomTransfer = rev.paymentModes?.ROOM_TRANSFER || { count: 0, baseAmount: 0, gstAmount: 0, totalAmount: 0 };

    const totalOrders = rev.totalOrders || 0;
    const dineInCount = totalOrders - roomTransfer.count;
    const dineInBase = rev.totalBaseAmount - roomTransfer.baseAmount;
    const dineInTax = rev.totalGstAmount - roomTransfer.gstAmount;
    const dineInTotal = rev.totalFinalDiscountedAmount - roomTransfer.totalAmount;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales & Revenue Summary Report</title>
          <style>
            @page { margin: 12mm 10mm; size: A4 portrait; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; font-size: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
            .title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
            .subtitle { color: #64748b; font-size: 11px; margin: 0; }
            .section-title { font-size: 13px; font-weight: 800; color: #0f172a; margin: 16px 0 6px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            thead { display: table-header-group; }
            tr { page-break-inside: avoid; break-inside: avoid; }
            th { background: #f1f5f9; text-align: left; padding: 6px 10px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
            td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 700; }
            tfoot tr td { font-weight: 800; background: #f8fafc; border-top: 1px solid #cbd5e1; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Sunrise Resorts - Sales & Revenue Summary Report</h1>
            <p class="subtitle">Period: ${dateRanges.revenue.start} to ${dateRanges.revenue.end} | Generated: ${new Date().toLocaleString()}</p>
          </div>

          <div class="section-title">1. Overall Sales Summary</div>
          <table>
            <thead><tr><th>Metric</th><th class="text-right">Amount (INR)</th></tr></thead>
            <tbody>
              <tr><td>Total Orders Completed</td><td class="text-right font-bold">${totalOrders}</td></tr>
              <tr><td>Total Discount</td><td class="text-right font-bold">INR ${Number(rev.totalDiscountAmount || 0).toFixed(2)}</td></tr>
              <tr><td>Net Sales (Base Amount)</td><td class="text-right font-bold">INR ${Number(rev.totalBaseAmount || 0).toFixed(2)}</td></tr>
              <tr><td>Total Tax (5% GST)</td><td class="text-right font-bold">INR ${Number(rev.totalGstAmount || 0).toFixed(2)}</td></tr>
              <tr><td class="font-bold">Total Settled Sales</td><td class="text-right font-bold">INR ${Number(rev.totalFinalDiscountedAmount || 0).toFixed(2)}</td></tr>
            </tbody>
          </table>

          <div class="section-title">2. Order Type Breakdown</div>
          <table>
            <thead>
              <tr><th>Order Type</th><th class="text-right">Base Amount</th><th class="text-right">CGST (2.5%)</th><th class="text-right">SGST (2.5%)</th><th class="text-right">Total Amount</th></tr>
            </thead>
            <tbody>
              <tr><td>DINE IN (${dineInCount})</td><td class="text-right">${dineInBase.toFixed(2)}</td><td class="text-right">${(dineInTax/2).toFixed(2)}</td><td class="text-right">${(dineInTax/2).toFixed(2)}</td><td class="text-right font-bold">${dineInTotal.toFixed(2)}</td></tr>
              <tr><td>ROOM SERVICE (${roomTransfer.count})</td><td class="text-right">${roomTransfer.baseAmount.toFixed(2)}</td><td class="text-right">${(roomTransfer.gstAmount/2).toFixed(2)}</td><td class="text-right">${(roomTransfer.gstAmount/2).toFixed(2)}</td><td class="text-right font-bold">${roomTransfer.totalAmount.toFixed(2)}</td></tr>
            </tbody>
            <tfoot>
              <tr><td>Total (${totalOrders})</td><td class="text-right">${rev.totalBaseAmount.toFixed(2)}</td><td class="text-right">${(rev.totalGstAmount/2).toFixed(2)}</td><td class="text-right">${(rev.totalGstAmount/2).toFixed(2)}</td><td class="text-right">${rev.totalFinalDiscountedAmount.toFixed(2)}</td></tr>
            </tfoot>
          </table>

          <div class="section-title">3. Payment Mode Collections</div>
          <table>
            <thead>
              <tr><th>Payment Mode</th><th class="text-right">Count</th><th class="text-right">Base Amount</th><th class="text-right">CGST (2.5%)</th><th class="text-right">SGST (2.5%)</th><th class="text-right">Total Amount</th></tr>
            </thead>
            <tbody>
              <tr><td>CASH</td><td class="text-right">${cash.count}</td><td class="text-right">${cash.baseAmount.toFixed(2)}</td><td class="text-right">${(cash.gstAmount/2).toFixed(2)}</td><td class="text-right">${(cash.gstAmount/2).toFixed(2)}</td><td class="text-right font-bold">${cash.totalAmount.toFixed(2)}</td></tr>
              <tr><td>CARD</td><td class="text-right">${card.count}</td><td class="text-right">${card.baseAmount.toFixed(2)}</td><td class="text-right">${(card.gstAmount/2).toFixed(2)}</td><td class="text-right">${(card.gstAmount/2).toFixed(2)}</td><td class="text-right font-bold">${card.totalAmount.toFixed(2)}</td></tr>
              <tr><td>UPI</td><td class="text-right">${upi.count}</td><td class="text-right">${upi.baseAmount.toFixed(2)}</td><td class="text-right">${(upi.gstAmount/2).toFixed(2)}</td><td class="text-right">${(upi.gstAmount/2).toFixed(2)}</td><td class="text-right font-bold">${upi.totalAmount.toFixed(2)}</td></tr>
              <tr><td>ROOM TRANSFER</td><td class="text-right">${roomTransfer.count}</td><td class="text-right">${roomTransfer.baseAmount.toFixed(2)}</td><td class="text-right">${(roomTransfer.gstAmount/2).toFixed(2)}</td><td class="text-right">${(roomTransfer.gstAmount/2).toFixed(2)}</td><td class="text-right font-bold">${roomTransfer.totalAmount.toFixed(2)}</td></tr>
            </tbody>
          </table>
        </body>
      </html>
    `;
    printHtml(html);
  };

  const downloadOrderItemReport = () => {
    const doc = generateOrderItemPDF();
    if (doc) doc.save(`order-items-${dateRanges.orderItem.start}-to-${dateRanges.orderItem.end}.pdf`);
  };

  const printOrderItemReport = () => {
    if (!data.orderItem) return;
    const oi = data.orderItem;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Restaurant Order Items Analysis Report (Excl. GST)</title>
          <style>
            @page { margin: 12mm 10mm; size: A4 portrait; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; font-size: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
            .title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
            .subtitle { color: #64748b; font-size: 11px; margin: 0; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
            .card-title { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; }
            .card-val { font-size: 16px; font-weight: 800; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            thead { display: table-header-group; }
            tr { page-break-inside: avoid; break-inside: avoid; }
            th { background: #f1f5f9; text-align: left; padding: 6px 10px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
            td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 700; }
            tfoot tr td { font-weight: 800; background: #f8fafc; border-top: 1.5px solid #cbd5e1; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Sunrise Resorts - Restaurant Order Items Report (Excl. GST)</h1>
            <p class="subtitle">Period: ${dateRanges.orderItem.start} to ${dateRanges.orderItem.end} | Generated: ${new Date().toLocaleString()}</p>
          </div>
          <div class="grid">
            <div class="card"><div class="card-title">Total Items Sold</div><div class="card-val">${oi.totalItemsSold} pcs</div></div>
            <div class="card"><div class="card-title">Unique Dishes Ordered</div><div class="card-val">${oi.totalUniqueItems} dishes</div></div>
            <div class="card"><div class="card-title">Total Base Amount (Excl. GST)</div><div class="card-val">INR ${Number(oi.totalAmountExcludingGst || 0).toFixed(2)}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th class="text-center" style="width: 40px;">#</th>
                <th>Item Name</th>
                <th class="text-center">Qty Sold</th>
                <th class="text-right">Unit Price (Excl. GST)</th>
                <th class="text-right">Total Base Amount</th>
              </tr>
            </thead>
            <tbody>
              ${oi.items.map((item, idx) => `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td class="font-bold">${escapeHtml(item.name)}</td>
                  <td class="text-center">${item.totalQuantity} pcs</td>
                  <td class="text-right">INR ${Number(item.price || 0).toFixed(2)}</td>
                  <td class="text-right font-bold">INR ${Number(item.totalAmount || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2">Total (${oi.totalUniqueItems} Unique Dishes)</td>
                <td class="text-center">${oi.totalItemsSold} pcs</td>
                <td class="text-right">-</td>
                <td class="text-right">INR ${Number(oi.totalAmountExcludingGst || 0).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;
    printHtml(html);
  };

  const generateDailyBillPDF = () => {
    if (!filteredDailyBills || filteredDailyBills.days.length === 0) return null;
    const doc = new jsPDF();
    const res = filteredDailyBills;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(res.monthTitle || 'Bill Summary', 105, 18, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Period: ${dateRanges.dailyBills.start} to ${dateRanges.dailyBills.end} | Generated: ${new Date().toLocaleString()}`, 105, 24, { align: 'center' });

    const tableBody: any[] = [];
    let currentSerNo = 1;

    res.days.forEach(day => {
      // Day header row
      tableBody.push([
        { content: day.dateHeaderStr, colSpan: 8, styles: { fillColor: [226, 232, 240], fontStyle: 'bold', textColor: [15, 23, 42] } }
      ]);

      day.orders.forEach(order => {
        const isCancelled = order.status === 'CANCELLED';
        tableBody.push([
          String(currentSerNo++).padStart(2, '0'),
          order.billNo,
          order.dateStr,
          isCancelled ? 'cancel' : Number(order.baseAmount).toFixed(2),
          isCancelled ? '-' : Number(order.sgstAmount).toFixed(2),
          isCancelled ? '-' : Number(order.cgstAmount).toFixed(2),
          isCancelled ? '-' : Number(order.totalAmount).toFixed(2),
          order.remarks || (isCancelled ? 'Cancelled' : (order.paymentMode || '-'))
        ]);
      });

      // Day subtotal
      tableBody.push([
        { content: `Day Total (${day.dateStr})`, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: Number(day.totalBaseAmount).toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 250, 252] } },
        { content: Number(day.totalSgstAmount).toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 250, 252] } },
        { content: Number(day.totalCgstAmount).toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 250, 252] } },
        { content: Number(day.totalAmount).toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 250, 252] } },
        { content: `${day.completedOrders} Orders`, styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }
      ]);
    });

    autoTable(doc, {
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 16 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'center', cellWidth: 24 },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { cellWidth: 34 },
      },
      head: [['Ser No', 'Bill No', 'Date', 'Amount', 'SGST 2.5%', 'CGST 2.5%', 'Total Amount', 'Remarks']],
      body: tableBody,
      foot: [
        [
          { content: 'Grand Total', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
          { content: Number(res.totalBaseAmount).toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [226, 232, 240] } },
          { content: Number(res.totalSgstAmount).toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [226, 232, 240] } },
          { content: Number(res.totalCgstAmount).toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [226, 232, 240] } },
          { content: Number(res.grandTotalAmount).toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [226, 232, 240] } },
          { content: `${res.completedOrders} Completed`, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } }
        ]
      ]
    });

    return doc;
  };

  const downloadDailyBillReport = () => {
    const doc = generateDailyBillPDF();
    if (doc) doc.save(`bill-summary-${dateRanges.dailyBills.start}-to-${dateRanges.dailyBills.end}.pdf`);
  };

  const printDailyBillReport = () => {
    if (!filteredDailyBills || filteredDailyBills.days.length === 0) return;
    const res = filteredDailyBills;
    let currentSerNo = 1;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHtml(res.monthTitle || 'Bill Summary')}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 10mm 12mm 10mm;
            }
            * { box-sizing: border-box; }
            body {
              font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header-title {
              text-align: center;
              font-size: 16px;
              font-weight: bold;
              font-style: italic;
              text-decoration: underline;
              margin-bottom: 4px;
            }
            .sub-title {
              text-align: center;
              font-size: 11px;
              color: #444;
              margin-bottom: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            thead {
              display: table-header-group;
            }
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            th, td {
              border: 1px solid #333;
              padding: 4px 6px;
            }
            th {
              background-color: #f1f5f9;
              font-weight: bold;
              text-align: center;
              font-size: 11px;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .day-header-cell {
              background-color: #e2e8f0;
              font-weight: bold;
              font-size: 12px;
              padding: 5px 8px;
              page-break-after: avoid;
              break-after: avoid;
            }
            .subtotal-cell {
              background-color: #f8fafc;
              font-weight: bold;
            }
            .grand-total-cell {
              background-color: #cbd5e1;
              font-weight: 900;
              font-size: 12px;
              border-top: 2px solid #000;
            }
            .cancelled-text {
              font-style: italic;
              color: #444;
            }
          </style>
        </head>
        <body>
          <div class="header-title">${escapeHtml(res.monthTitle || 'Bill Summary')}</div>
          <div class="sub-title">Period: ${dateRanges.dailyBills.start} to ${dateRanges.dailyBills.end} &bull; Generated: ${new Date().toLocaleString()}</div>
          <table>
            <thead>
              <tr>
                <th style="width: 45px;">Ser No</th>
                <th style="width: 70px;">Bill No</th>
                <th style="width: 95px;">Date</th>
                <th class="text-right">Amount</th>
                <th class="text-right" style="width: 70px;">SGST 2.5%</th>
                <th class="text-right" style="width: 70px;">CGST 2.5%</th>
                <th class="text-right">Total Amount</th>
                <th style="width: 100px;">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${res.days.map(day => `
                <tr>
                  <td colspan="8" class="day-header-cell">${escapeHtml(day.dateHeaderStr)}</td>
                </tr>
                ${day.orders.map(order => {
                  const isCancelled = order.status === 'CANCELLED';
                  const ser = String(currentSerNo++).padStart(2, '0');
                  return `
                    <tr>
                      <td class="text-center">${ser}.</td>
                      <td class="text-center" style="font-weight: 600;">${escapeHtml(order.billNo)}</td>
                      <td class="text-center">${escapeHtml(order.dateStr)}</td>
                      <td class="text-right">${isCancelled ? '<span class="cancelled-text">cancel</span>' : Number(order.baseAmount).toFixed(2)}</td>
                      <td class="text-right">${isCancelled ? '-' : Number(order.sgstAmount).toFixed(2)}</td>
                      <td class="text-right">${isCancelled ? '-' : Number(order.cgstAmount).toFixed(2)}</td>
                      <td class="text-right" style="font-weight: ${isCancelled ? 'normal' : 'bold'};">${isCancelled ? '-' : Number(order.totalAmount).toFixed(2)}</td>
                      <td>${escapeHtml(order.remarks || (isCancelled ? 'Cancelled' : ''))}</td>
                    </tr>
                  `;
                }).join('')}
                <tr>
                  <td colspan="3" class="subtotal-cell text-right">Day Total (${escapeHtml(day.dateStr)}):</td>
                  <td class="subtotal-cell text-right">${Number(day.totalBaseAmount).toFixed(2)}</td>
                  <td class="subtotal-cell text-right">${Number(day.totalSgstAmount).toFixed(2)}</td>
                  <td class="subtotal-cell text-right">${Number(day.totalCgstAmount).toFixed(2)}</td>
                  <td class="subtotal-cell text-right">${Number(day.totalAmount).toFixed(2)}</td>
                  <td class="subtotal-cell">${day.completedOrders} Completed</td>
                </tr>
              `).join('')}
              <tr>
                <td colspan="3" class="grand-total-cell text-right">Grand Total:</td>
                <td class="grand-total-cell text-right">${Number(res.totalBaseAmount).toFixed(2)}</td>
                <td class="grand-total-cell text-right">${Number(res.totalSgstAmount).toFixed(2)}</td>
                <td class="grand-total-cell text-right">${Number(res.totalCgstAmount).toFixed(2)}</td>
                <td class="grand-total-cell text-right">${Number(res.grandTotalAmount).toFixed(2)}</td>
                <td class="grand-total-cell">${res.completedOrders} Orders</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;
    printHtml(html);
  };

  // Filtered & sorted daily bills summary
  const filteredDailyBills = useMemo(() => {
    if (!data.dailyBills) return null;
    const res = data.dailyBills;
    const search = dailyBillSearch.trim().toLowerCase();

    const days = res.days.map(day => {
      const orders = day.orders.filter(order => {
        if (dailyBillStatusFilter !== 'ALL' && order.status !== dailyBillStatusFilter) {
          return false;
        }
        if (dailyBillPaymentFilter !== 'ALL') {
          if (order.status === 'CANCELLED') return false;
          if (order.paymentMode !== dailyBillPaymentFilter) return false;
        }
        if (search) {
          const matchBill = order.billNo.toLowerCase().includes(search);
          const matchOrder = String(order.orderNumber).includes(search);
          const matchRemarks = order.remarks.toLowerCase().includes(search);
          const matchTable = order.tableNumber ? String(order.tableNumber).includes(search) : false;
          const matchWaiter = order.waiterName ? order.waiterName.toLowerCase().includes(search) : false;
          if (!matchBill && !matchOrder && !matchRemarks && !matchTable && !matchWaiter) {
            return false;
          }
        }
        return true;
      });

      let totalBase = 0;
      let totalSgst = 0;
      let totalCgst = 0;
      let totalAmt = 0;
      let completed = 0;
      let cancelled = 0;

      orders.forEach(o => {
        if (o.status === 'CANCELLED') {
          cancelled += 1;
        } else {
          completed += 1;
          totalBase = Number((totalBase + o.baseAmount).toFixed(2));
          totalSgst = Number((totalSgst + o.sgstAmount).toFixed(2));
          totalCgst = Number((totalCgst + o.cgstAmount).toFixed(2));
          totalAmt = Number((totalAmt + o.totalAmount).toFixed(2));
        }
      });

      return {
        ...day,
        totalOrders: orders.length,
        completedOrders: completed,
        cancelledOrders: cancelled,
        totalBaseAmount: totalBase,
        totalSgstAmount: totalSgst,
        totalCgstAmount: totalCgst,
        totalAmount: totalAmt,
        orders,
      };
    }).filter(day => day.orders.length > 0);

    let grandBase = 0;
    let grandSgst = 0;
    let grandCgst = 0;
    let grandTotal = 0;
    let totalCompleted = 0;
    let totalCancelled = 0;
    let totalOrdCount = 0;

    days.forEach(d => {
      grandBase = Number((grandBase + d.totalBaseAmount).toFixed(2));
      grandSgst = Number((grandSgst + d.totalSgstAmount).toFixed(2));
      grandCgst = Number((grandCgst + d.totalCgstAmount).toFixed(2));
      grandTotal = Number((grandTotal + d.totalAmount).toFixed(2));
      totalCompleted += d.completedOrders;
      totalCancelled += d.cancelledOrders;
      totalOrdCount += d.totalOrders;
    });

    return {
      ...res,
      totalOrders: totalOrdCount,
      completedOrders: totalCompleted,
      cancelledOrders: totalCancelled,
      totalBaseAmount: grandBase,
      totalSgstAmount: grandSgst,
      totalCgstAmount: grandCgst,
      grandTotalAmount: grandTotal,
      days,
    };
  }, [data.dailyBills, dailyBillSearch, dailyBillStatusFilter, dailyBillPaymentFilter]);

  // Filtered & sorted order items
  const filteredOrderItems = useMemo(() => {
    if (!data.orderItem?.items) return [];
    let list = [...data.orderItem.items];

    if (itemSearchQuery.trim()) {
      const q = itemSearchQuery.toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(q));
    }

    if (itemSortBy === 'quantity') {
      list.sort((a, b) => b.totalQuantity - a.totalQuantity);
    } else if (itemSortBy === 'amount') {
      list.sort((a, b) => b.totalAmount - a.totalAmount);
    } else if (itemSortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [data.orderItem, itemSearchQuery, itemSortBy]);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12 px-1 sm:px-0">
      {/* Header & Section Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
            Analytics Dashboard
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            {activeCategory === 'HOTEL' 
              ? 'Gain insights into hotel room revenue, bookings, and channel breakdown.'
              : 'Gain insights into restaurant revenue, ordered items sales, and staff performance.'}
          </p>
        </div>

        {/* Category Option Selector */}
        <div className="grid grid-cols-2 w-full sm:w-auto bg-surface/50 p-1.5 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md shrink-0">
          <button
            onClick={() => setActiveCategory('HOTEL')}
            className={`flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeCategory === 'HOTEL'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Hotel size={16} className="shrink-0" />
            <span className="truncate">Hotel Analytics</span>
          </button>
          <button
            onClick={() => setActiveCategory('RESTAURANT')}
            className={`flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeCategory === 'RESTAURANT'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <UtensilsCrossed size={16} className="shrink-0" />
            <span className="truncate">Restaurant Analytics</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ===================== HOTEL ANALYTICS SECTION ===================== */}
        {activeCategory === 'HOTEL' && (
          <motion.div
            key="hotel-analytics-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 sm:space-y-8"
          >
            {/* Booking Analysis Section */}
            <section className="space-y-4 sm:space-y-6">
              <DateRangeFilter
                title="Hotel Bookings & Occupancy"
                dateNote="Check-Out Date"
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
                onDownload={downloadBookingReport}
                onPrint={printBookingReport}
                hasData={!!data.booking}
              />

              {loading.booking ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
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
            <section className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 border-t border-white/5">
              <DateRangeFilter
                title="Channel Breakdown"
                dateNote="Check-Out Date"
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {Object.keys(data.channel?.channelBreakdown || {}).length > 0 && (
                    <>
                      <div className="bg-surface/40 backdrop-blur-md border border-white/10 p-4 sm:p-6 rounded-2xl h-[260px] sm:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={Object.entries(data.channel!.channelBreakdown).map(([name, value]) => ({ name, value }))}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={75}
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
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 content-start">
                        {Object.entries(data.channel!.channelBreakdown).map(([channel, count], index) => (
                          <div key={channel} className="bg-surface/40 backdrop-blur-md border border-white/10 p-3 sm:p-4 rounded-xl flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1 sm:mb-2">
                              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
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
          </motion.div>
        )}

        {/* ===================== RESTAURANT ANALYTICS SECTION ===================== */}
        {activeCategory === 'RESTAURANT' && (
          <motion.div
            key="restaurant-analytics-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 sm:space-y-8"
          >
            {/* ===================== DAILY BILL SUMMARY SECTION ===================== */}
            <section className="space-y-4 sm:space-y-6">
              <DateRangeFilter
                title="Restaurant Bill Summary (Daily Orders & 5% GST Breakdown)"
                icon={FileSpreadsheet}
                iconColor="text-emerald-400"
                color={{ bgLight: 'bg-emerald-500/20', text: 'text-emerald-400', bgHover: 'bg-emerald-500/30', border: 'border-emerald-500/50' }}
                startDate={dateRanges.dailyBills.start}
                setStartDate={(v: string) => updateDateRange('dailyBills', 'start', v)}
                endDate={dateRanges.dailyBills.end}
                setEndDate={(v: string) => updateDateRange('dailyBills', 'end', v)}
                onGenerate={fetchDailyBillSummary}
                loading={loading.dailyBills}
                setDateRangeType={(type: string) => setPresetDateRange(type, 'dailyBills', getDailyBillSummary)}
                error={errors.dailyBills}
                onDownload={downloadDailyBillReport}
                onPrint={printDailyBillReport}
                hasData={!!filteredDailyBills && (filteredDailyBills.totalOrders > 0)}
              />

              {loading.dailyBills ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredDailyBills ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Summary Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                    <StatCard
                      title="Total Orders"
                      value={`${filteredDailyBills.totalOrders}`}
                      icon={Receipt}
                      color="bg-purple-500"
                    />
                    <StatCard
                      title="Total Base Amount"
                      value={`₹${Number(filteredDailyBills.totalBaseAmount || 0).toFixed(2)}`}
                      icon={IndianRupee}
                      color="bg-blue-500"
                    />
                    <StatCard
                      title="SGST (2.5%)"
                      value={`₹${Number(filteredDailyBills.totalSgstAmount || 0).toFixed(2)}`}
                      icon={Receipt}
                      color="bg-amber-500"
                    />
                    <StatCard
                      title="CGST (2.5%)"
                      value={`₹${Number(filteredDailyBills.totalCgstAmount || 0).toFixed(2)}`}
                      icon={Receipt}
                      color="bg-orange-500"
                    />
                    <StatCard
                      title="Grand Total (Inc. GST)"
                      value={`₹${Number(filteredDailyBills.grandTotalAmount || 0).toFixed(2)}`}
                      icon={IndianRupee}
                      color="bg-emerald-500"
                    />
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="bg-surface/30 p-3.5 sm:p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 sm:gap-4 shadow-md">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search by Bill # (e.g. A1-01), table, remarks..."
                        value={dailyBillSearch}
                        onChange={(e) => setDailyBillSearch(e.target.value)}
                        className="w-full bg-surface/60 border border-white/10 text-white pl-10 pr-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status Filter */}
                      <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
                        {(['ALL', 'COMPLETED', 'CANCELLED'] as const).map(st => (
                          <button
                            key={st}
                            onClick={() => setDailyBillStatusFilter(st)}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                              dailyBillStatusFilter === st
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {st === 'ALL' ? 'All Status' : st === 'COMPLETED' ? 'Completed' : 'Cancelled'}
                          </button>
                        ))}
                      </div>

                      {/* Payment Mode Filter */}
                      <select
                        value={dailyBillPaymentFilter}
                        onChange={(e) => setDailyBillPaymentFilter(e.target.value)}
                        className="bg-black/40 border border-white/10 text-slate-300 text-xs rounded-xl px-3 py-1.5 outline-none focus:border-emerald-500 font-medium cursor-pointer"
                      >
                        <option value="ALL">All Payment Modes</option>
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                        <option value="ROOM_TRANSFER">Room Transfer</option>
                      </select>
                    </div>
                  </div>

                  {/* Desktop / Tablet Table View */}
                  <div className="hidden md:block bg-surface/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                    <div className="max-h-[600px] overflow-y-auto overflow-x-auto custom-scrollbar">
                      <table className="w-full text-sm text-left text-slate-300 min-w-[750px] relative">
                        <thead className="text-xs text-slate-400 uppercase bg-black/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-20">
                          <tr>
                            <th scope="col" className="px-4 py-3.5 w-16 text-center">Ser No</th>
                            <th scope="col" className="px-4 py-3.5 w-24 text-center">Bill No</th>
                            <th scope="col" className="px-4 py-3.5 text-center">Date</th>
                            <th scope="col" className="px-4 py-3.5 text-right">Amount (Base)</th>
                            <th scope="col" className="px-4 py-3.5 text-right">SGST (2.5%)</th>
                            <th scope="col" className="px-4 py-3.5 text-right">CGST (2.5%)</th>
                            <th scope="col" className="px-4 py-3.5 text-right">Total Amount</th>
                            <th scope="col" className="px-4 py-3.5 text-left">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-xs">
                          {filteredDailyBills.days.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-sans">
                                {dailyBillSearch ? 'No bills match your search filter.' : 'No restaurant orders found in this date range.'}
                              </td>
                            </tr>
                          ) : (
                            (() => {
                              let rowSerNo = 1;
                              return filteredDailyBills.days.map((day) => (
                                <React.Fragment key={day.dateKey}>
                                  {/* Day Group Header */}
                                  <tr className="bg-slate-800/80 border-y border-white/10 font-sans sticky z-10">
                                    <td colSpan={8} className="px-4 py-2.5 font-bold text-white text-xs">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Calendar size={14} className="text-emerald-400" />
                                          <span className="text-sm font-bold text-emerald-300">{day.dateHeaderStr}</span>
                                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-normal">
                                            {day.totalOrders} Orders
                                          </span>
                                        </div>
                                        <div className="text-[11px] font-medium text-slate-300 flex items-center gap-3">
                                          <span>Base: <strong className="text-white font-mono">₹{day.totalBaseAmount.toFixed(2)}</strong></span>
                                          <span>GST: <strong className="text-amber-300 font-mono">₹{(day.totalSgstAmount + day.totalCgstAmount).toFixed(2)}</strong></span>
                                          <span>Total: <strong className="text-emerald-400 font-mono">₹{day.totalAmount.toFixed(2)}</strong></span>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>

                                  {/* Orders for this day */}
                                  {day.orders.map((order) => {
                                    const isCancelled = order.status === 'CANCELLED';
                                    const ser = String(rowSerNo++).padStart(2, '0');

                                    return (
                                      <tr
                                        key={`bill-row-${order.id}`}
                                        className={`hover:bg-white/5 transition-colors ${isCancelled ? 'opacity-60 bg-red-500/5' : ''}`}
                                      >
                                        <td className="px-4 py-2.5 text-center text-slate-500 font-semibold">{ser}.</td>
                                        <td className="px-4 py-2.5 text-center font-bold text-white tracking-wide">
                                          {order.billNo}
                                        </td>
                                        <td className="px-4 py-2.5 text-center text-slate-300">
                                          {order.dateStr}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-medium text-slate-200">
                                          {isCancelled ? (
                                            <span className="text-rose-400 font-bold font-sans text-[11px] px-1.5 py-0.5 rounded bg-rose-500/10">cancel</span>
                                          ) : (
                                            `₹${Number(order.baseAmount).toFixed(2)}`
                                          )}
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-amber-400/90 font-medium">
                                          {isCancelled ? '-' : `₹${Number(order.sgstAmount).toFixed(2)}`}
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-amber-400/90 font-medium">
                                          {isCancelled ? '-' : `₹${Number(order.cgstAmount).toFixed(2)}`}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-bold text-emerald-400">
                                          {isCancelled ? '-' : `₹${Number(order.totalAmount).toFixed(2)}`}
                                        </td>
                                        <td className="px-4 py-2.5 text-left font-sans text-xs">
                                          {isCancelled ? (
                                            <span className="text-rose-400 font-medium text-[11px] flex items-center gap-1">
                                              <XCircle size={12} /> {order.remarks}
                                            </span>
                                          ) : (
                                            <span className="text-slate-300 text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                                              {order.remarks}
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}

                                  {/* Day Subtotal Row */}
                                  <tr className="bg-black/40 border-t border-white/10 font-bold font-mono text-xs">
                                    <td colSpan={3} className="px-4 py-2 text-right text-slate-400 font-sans text-xs">
                                      Subtotal ({day.dateStr}):
                                    </td>
                                    <td className="px-4 py-2 text-right text-slate-200">
                                      ₹{day.totalBaseAmount.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-2 text-right text-amber-400">
                                      ₹{day.totalSgstAmount.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-2 text-right text-amber-400">
                                      ₹{day.totalCgstAmount.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-2 text-right text-emerald-400 text-sm font-black">
                                      ₹{day.totalAmount.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-2 text-slate-400 font-sans text-[11px]">
                                      {day.completedOrders} Completed
                                    </td>
                                  </tr>
                                </React.Fragment>
                              ));
                            })()
                          )}
                        </tbody>
                        {filteredDailyBills.days.length > 0 && (
                          <tfoot className="bg-black/90 backdrop-blur-md border-t-2 border-emerald-500/40 text-white sticky bottom-0 z-20 font-mono text-xs font-bold">
                            <tr>
                              <td colSpan={3} className="px-4 py-3.5 text-right font-sans text-xs uppercase tracking-wider text-emerald-400">
                                Grand Total:
                              </td>
                              <td className="px-4 py-3.5 text-right text-white">
                                ₹{filteredDailyBills.totalBaseAmount.toFixed(2)}
                              </td>
                              <td className="px-4 py-3.5 text-right text-amber-400">
                                ₹{filteredDailyBills.totalSgstAmount.toFixed(2)}
                              </td>
                              <td className="px-4 py-3.5 text-right text-amber-400">
                                ₹{filteredDailyBills.totalCgstAmount.toFixed(2)}
                              </td>
                              <td className="px-4 py-3.5 text-right text-emerald-400 text-base font-black">
                                ₹{filteredDailyBills.grandTotalAmount.toFixed(2)}
                              </td>
                              <td className="px-4 py-3.5 font-sans text-xs text-slate-300">
                                {filteredDailyBills.completedOrders} Completed Orders
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>

                  {/* Mobile Grouped Cards View (md:hidden) */}
                  <div className="block md:hidden space-y-4">
                    {filteredDailyBills.days.length === 0 ? (
                      <div className="bg-surface/40 backdrop-blur-md rounded-2xl border border-white/10 p-8 text-center text-slate-500 text-sm">
                        {dailyBillSearch ? 'No bills match your search filter.' : 'No restaurant orders found in this date range.'}
                      </div>
                    ) : (
                      filteredDailyBills.days.map(day => (
                        <div key={`mob-day-${day.dateKey}`} className="bg-surface/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-lg space-y-2">
                          <div className="bg-slate-800/90 px-4 py-3 border-b border-white/10 flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-white text-sm">{day.dateHeaderStr}</h4>
                              <p className="text-[11px] text-slate-400">{day.totalOrders} Orders</p>
                            </div>
                            <div className="text-right">
                              <span className="text-emerald-400 font-bold font-mono text-sm block">₹{day.totalAmount.toFixed(2)}</span>
                              <span className="text-[10px] text-slate-400">Base: ₹{day.totalBaseAmount.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="p-3 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                            {day.orders.map((order) => {
                              const isCancelled = order.status === 'CANCELLED';
                              return (
                                <div
                                  key={`mob-order-${order.id}`}
                                  className={`p-3 rounded-xl border transition-colors ${
                                    isCancelled ? 'bg-rose-500/5 border-rose-500/20' : 'bg-black/30 border-white/5'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-mono font-bold text-white">{order.billNo}</span>
                                      <span className="text-[10px] text-slate-400">&bull; {order.dateStr}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      isCancelled 
                                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    }`}>
                                      {isCancelled ? 'CANCELLED' : (order.paymentMode || 'PAID')}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-4 gap-1 text-[11px] font-mono py-1.5 border-y border-white/5 text-center">
                                    <div>
                                      <span className="text-[9px] text-slate-500 font-sans block">Base</span>
                                      <span className="text-slate-300">{isCancelled ? '-' : `₹${order.baseAmount.toFixed(2)}`}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-slate-500 font-sans block">SGST (2.5%)</span>
                                      <span className="text-amber-400">{isCancelled ? '-' : `₹${order.sgstAmount.toFixed(2)}`}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-slate-500 font-sans block">CGST (2.5%)</span>
                                      <span className="text-amber-400">{isCancelled ? '-' : `₹${order.cgstAmount.toFixed(2)}`}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-slate-500 font-sans block">Total</span>
                                      <span className="text-emerald-400 font-bold">{isCancelled ? '-' : `₹${order.totalAmount.toFixed(2)}`}</span>
                                    </div>
                                  </div>

                                  {order.remarks && (
                                    <div className="text-[10px] text-slate-400 pt-1.5 flex items-center justify-between">
                                      <span>Remarks: {order.remarks}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </section>

            {/* Restaurant Revenue Section */}
            <section className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 border-t border-white/5">
              <DateRangeFilter
                title="Restaurant Revenue Analysis"
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
                onDownload={downloadRevenueReport}
                onPrint={printRevenueReport}
                hasData={!!data.revenue}
              />

              {loading.revenue ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                    <PaymentModeCard
                      title="Cash Collection"
                      baseAmount={data.revenue?.paymentModes?.CASH?.baseAmount ?? 0}
                      gstAmount={data.revenue?.paymentModes?.CASH?.gstAmount ?? 0}
                      totalAmount={data.revenue?.paymentModes?.CASH?.totalAmount ?? (data.revenue?.cashAmount || 0)}
                      icon={Banknote}
                      colorClass="text-emerald-400"
                      badgeBg="bg-emerald-500/20"
                      borderColor="border-emerald-500/30"
                      gradientFrom="from-emerald-500"
                    />
                    <PaymentModeCard
                      title="Card Collection"
                      baseAmount={data.revenue?.paymentModes?.CARD?.baseAmount ?? 0}
                      gstAmount={data.revenue?.paymentModes?.CARD?.gstAmount ?? 0}
                      totalAmount={data.revenue?.paymentModes?.CARD?.totalAmount ?? (data.revenue?.cardAmount || 0)}
                      icon={CreditCard}
                      colorClass="text-sky-400"
                      badgeBg="bg-sky-500/20"
                      borderColor="border-sky-500/30"
                      gradientFrom="from-sky-500"
                    />
                    <PaymentModeCard
                      title="UPI Collection"
                      baseAmount={data.revenue?.paymentModes?.UPI?.baseAmount ?? 0}
                      gstAmount={data.revenue?.paymentModes?.UPI?.gstAmount ?? 0}
                      totalAmount={data.revenue?.paymentModes?.UPI?.totalAmount ?? (data.revenue?.upiAmount || 0)}
                      icon={QrCode}
                      colorClass="text-purple-400"
                      badgeBg="bg-purple-500/20"
                      borderColor="border-purple-500/30"
                      gradientFrom="from-purple-500"
                    />
                    <PaymentModeCard
                      title="Room Transfer"
                      baseAmount={data.revenue?.paymentModes?.ROOM_TRANSFER?.baseAmount ?? 0}
                      gstAmount={data.revenue?.paymentModes?.ROOM_TRANSFER?.gstAmount ?? 0}
                      totalAmount={data.revenue?.paymentModes?.ROOM_TRANSFER?.totalAmount ?? (data.revenue?.roomTransferAmount || 0)}
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

            {/* Restaurant Order Items Section */}
            <section className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 border-t border-white/5">
              <DateRangeFilter
                title="Restaurant Order Items (Excl. GST)"
                icon={UtensilsCrossed}
                iconColor="text-emerald-400"
                color={{ bgLight: 'bg-emerald-500/20', text: 'text-emerald-400', bgHover: 'bg-emerald-500/30', border: 'border-emerald-500/50' }}
                startDate={dateRanges.orderItem.start}
                setStartDate={(v: string) => updateDateRange('orderItem', 'start', v)}
                endDate={dateRanges.orderItem.end}
                setEndDate={(v: string) => updateDateRange('orderItem', 'end', v)}
                onGenerate={fetchOrderItemAnalysis}
                loading={loading.orderItem}
                setDateRangeType={(type: string) => setPresetDateRange(type, 'orderItem', getOrderItemAnalysis)}
                error={errors.orderItem}
                onDownload={downloadOrderItemReport}
                onPrint={printOrderItemReport}
                hasData={!!data.orderItem && (data.orderItem.items?.length ?? 0) > 0}
              />

              {loading.orderItem ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : data.orderItem ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    <StatCard
                      title="Total Items Sold"
                      value={`${data.orderItem.totalItemsSold || 0} pcs`}
                      icon={ShoppingBag}
                      color="bg-emerald-500"
                    />
                    <StatCard
                      title="Unique Dishes Ordered"
                      value={`${data.orderItem.totalUniqueItems || 0} items`}
                      icon={UtensilsCrossed}
                      color="bg-blue-500"
                    />
                    <StatCard
                      title="Total Amount (Excl. GST)"
                      value={`₹${Number(data.orderItem.totalAmountExcludingGst || 0).toFixed(2)}`}
                      icon={IndianRupee}
                      color="bg-amber-500"
                    />
                  </div>

                  {/* Search & Sort Controls */}
                  <div className="bg-surface/30 p-3.5 sm:p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4 shadow-md">
                    <div className="relative w-full md:w-80">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search ordered items..."
                        value={itemSearchQuery}
                        onChange={(e) => setItemSearchQuery(e.target.value)}
                        className="w-full bg-surface/60 border border-white/10 text-white pl-10 pr-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto justify-between sm:justify-end overflow-x-auto pb-1 sm:pb-0">
                      <span className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1 font-medium shrink-0">
                        <ArrowUpDown size={13} /> Sort:
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setItemSortBy('quantity')}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
                            itemSortBy === 'quantity'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5'
                          }`}
                        >
                          Quantity
                        </button>
                        <button
                          onClick={() => setItemSortBy('amount')}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
                            itemSortBy === 'amount'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5'
                          }`}
                        >
                          Total Price
                        </button>
                        <button
                          onClick={() => setItemSortBy('name')}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
                            itemSortBy === 'name'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5'
                          }`}
                        >
                          Name
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ===== MOBILE CARDS VIEW (md:hidden) ===== */}
                  <div className="block md:hidden space-y-3">
                    {filteredOrderItems.length === 0 ? (
                      <div className="bg-surface/40 backdrop-blur-md rounded-2xl border border-white/10 p-8 text-center text-slate-500 text-sm">
                        {itemSearchQuery ? 'No items match your search.' : 'No items ordered in this date range.'}
                      </div>
                    ) : (
                      <>
                        <div className="max-h-[460px] overflow-y-auto custom-scrollbar space-y-2.5 pr-1">
                          {filteredOrderItems.map((item, index) => {
                            const maxQty = Math.max(...data.orderItem!.items.map(i => i.totalQuantity), 1);
                            const progressPercent = Math.round((item.totalQuantity / maxQty) * 100);
                            const sharePercent = ((item.totalAmount / (data.orderItem?.totalAmountExcludingGst || 1)) * 100).toFixed(1);

                            return (
                              <motion.div
                                key={item.menuItemId || `item-mob-${item.name}-${index}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="bg-surface/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 space-y-2.5 shadow-md"
                              >
                                <div className="flex items-start justify-between gap-2.5">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                                      {item.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-mono text-slate-500 font-bold">#{index + 1}</span>
                                        <h4 className="text-sm font-bold text-white leading-snug break-words">
                                          {item.name}
                                        </h4>
                                      </div>
                                      <span className="text-xs font-mono text-slate-400 block mt-0.5">
                                        ₹{Number(item.price || 0).toFixed(2)} <span className="text-[10px] text-slate-500">/ pc</span>
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <div className="font-bold text-base text-emerald-400 font-mono">
                                      ₹{Number(item.totalAmount || 0).toFixed(2)}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      {sharePercent}% share
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs">
                                  <span className="text-slate-400 text-[11px]">Quantity Sold:</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-20 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className="bg-emerald-500 h-full rounded-full"
                                        style={{ width: `${progressPercent}%` }}
                                      />
                                    </div>
                                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold text-xs">
                                      {item.totalQuantity} pcs
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Mobile Grand Total Card */}
                        <div className="bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/30 space-y-2 shadow-lg">
                          <div className="flex items-center justify-between text-xs text-slate-300 font-bold uppercase tracking-wider">
                            <span>Grand Total</span>
                            <span>{data.orderItem?.totalUniqueItems || 0} Unique Items</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-white/10">
                            <span className="text-emerald-400 font-bold text-sm">
                              {data.orderItem?.totalItemsSold || 0} pcs sold
                            </span>
                            <span className="text-emerald-400 text-lg font-black font-mono">
                              ₹{Number(data.orderItem?.totalAmountExcludingGst || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* ===== DESKTOP TABLE VIEW (hidden md:block) ===== */}
                  <div className="hidden md:block bg-surface/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                    <div className="max-h-[520px] overflow-y-auto overflow-x-auto custom-scrollbar">
                      <table className="w-full text-sm text-left text-slate-300 min-w-[650px] relative">
                        <thead className="text-xs text-slate-400 uppercase bg-black/70 backdrop-blur-md border-b border-white/10 sticky top-0 z-10">
                          <tr>
                            <th scope="col" className="px-6 py-4 w-16 text-center">#</th>
                            <th scope="col" className="px-6 py-4">Item Name</th>
                            <th scope="col" className="px-6 py-4 text-center">Unit Price (Excl. GST)</th>
                            <th scope="col" className="px-6 py-4 text-center">Quantity Sold</th>
                            <th scope="col" className="px-6 py-4 text-right">Total Price (Excl. GST)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredOrderItems.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                                {itemSearchQuery ? 'No items match your search.' : 'No items ordered in this date range.'}
                              </td>
                            </tr>
                          ) : (
                            filteredOrderItems.map((item, index) => {
                              const maxQty = Math.max(...data.orderItem!.items.map(i => i.totalQuantity), 1);
                              const progressPercent = Math.round((item.totalQuantity / maxQty) * 100);

                              return (
                                <motion.tr
                                  key={item.menuItemId || `item-desk-${item.name}-${index}`}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.02 }}
                                  className="hover:bg-white/5 transition-colors"
                                >
                                  <td className="px-6 py-4 text-center font-mono text-xs text-slate-500">
                                    {index + 1}
                                  </td>
                                  <td className="px-6 py-4 font-semibold text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                                      {item.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span>{item.name}</span>
                                  </td>
                                  <td className="px-6 py-4 text-center font-mono text-slate-300">
                                    ₹{Number(item.price || 0).toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center gap-1.5">
                                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-0.5 rounded-full font-bold text-xs">
                                        {item.totalQuantity} pcs
                                      </span>
                                      <div className="w-20 bg-white/5 h-1 rounded-full overflow-hidden">
                                        <div
                                          className="bg-emerald-500 h-full rounded-full"
                                          style={{ width: `${progressPercent}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="font-bold text-base text-emerald-400 font-mono">
                                      ₹{Number(item.totalAmount || 0).toFixed(2)}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      {((item.totalAmount / (data.orderItem?.totalAmountExcludingGst || 1)) * 100).toFixed(1)}% of total
                                    </div>
                                  </td>
                                </motion.tr>
                              );
                            })
                          )}
                        </tbody>
                        {filteredOrderItems.length > 0 && (
                          <tfoot className="bg-black/80 backdrop-blur-md border-t border-white/10 font-semibold text-white sticky bottom-0 z-10">
                            <tr>
                              <td colSpan={3} className="px-6 py-4 text-slate-300 font-bold uppercase tracking-wider text-xs">
                                Grand Total ({data.orderItem?.totalUniqueItems || 0} Unique Items)
                              </td>
                              <td className="px-6 py-4 text-center text-emerald-400 font-bold">
                                {data.orderItem?.totalItemsSold || 0} pcs
                              </td>
                              <td className="px-6 py-4 text-right text-emerald-400 text-lg font-black font-mono">
                                ₹{Number(data.orderItem?.totalAmountExcludingGst || 0).toFixed(2)}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            {/* Waiter Analysis Section */}
            <section className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 border-t border-white/5">
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
                <>
                  {/* Mobile View for Waiter */}
                  <div className="block md:hidden space-y-2.5">
                    {data.waiter.length === 0 ? (
                      <div className="bg-surface/40 backdrop-blur-md rounded-2xl border border-white/10 p-8 text-center text-slate-500 text-sm">
                        No waiter data found for the selected date range.
                      </div>
                    ) : (
                      <div className="max-h-[380px] overflow-y-auto custom-scrollbar space-y-2.5 pr-1">
                        {data.waiter.map((waiter, index) => (
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
                </>
              )}
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
