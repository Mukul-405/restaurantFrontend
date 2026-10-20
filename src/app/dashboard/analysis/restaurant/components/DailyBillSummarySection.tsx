import React, { useState, useMemo } from 'react';
import {
  Receipt, Banknote, CreditCard, QrCode, Search, Hotel,
  FileSpreadsheet, CheckCircle2, XCircle, Check, Layers, Sparkles, IndianRupee, Tag, Calendar
} from 'lucide-react';
import { DateRangeFilter } from '../../common/DateRangeFilter';
import { StatCard } from '../../common/StatCard';
import { getLocalDateString } from '../../common/dateUtils';
import {
  getDailyBillSummary,
  DailyBillSummaryResult,
  DailyBillSummaryItem,
  DayGroupSummary
} from '../../../../../lib/analysis';
import { downloadDailyBillReport, printDailyBillReport } from '../restaurantReports';

export const DailyBillSummarySection: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    end: getLocalDateString(new Date()),
  });
  const [data, setData] = useState<DailyBillSummaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local filter for Daily Bill Summary table
  const [dailyBillSearch, setDailyBillSearch] = useState('');
  const [dailyBillStatusFilter, setDailyBillStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [dailyBillPaymentFilter, setDailyBillPaymentFilter] = useState<string>('ALL');

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
      const result = await getDailyBillSummary(start, end);
      setData(result);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to fetch daily bills analysis';
      setError(msg);
      console.error('Failed to fetch daily bills analysis', err);
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

  const filteredDailyBills = useMemo(() => {
    if (!data) return null;
    const res = data;
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
      let totalDiscount = 0;
      let totalTaxable = 0;
      let totalSgst = 0;
      let totalCgst = 0;
      let totalAmt = 0;
      let completed = 0;
      let cancelled = 0;

      const mappedOrders = orders.map(o => {
        if (o.status === 'CANCELLED') {
          cancelled += 1;
          return { ...o };
        } else {
          completed += 1;

          const originalBase = Number((o.originalBaseAmount ?? o.baseAmount) || 0);
          const disc = Number(o.discountAmount || 0);
          const taxable = Number(Math.max(0, originalBase - disc).toFixed(2));
          const sgst = Number(o.sgstAmount || (taxable * 0.025).toFixed(2));
          const cgst = Number(o.cgstAmount || (taxable * 0.025).toFixed(2));
          const finalTot = Number(Math.max(0, taxable + sgst + cgst).toFixed(2));

          totalBase = Number((totalBase + originalBase).toFixed(2));
          totalDiscount = Number((totalDiscount + disc).toFixed(2));
          totalTaxable = Number((totalTaxable + taxable).toFixed(2));
          totalSgst = Number((totalSgst + sgst).toFixed(2));
          totalCgst = Number((totalCgst + cgst).toFixed(2));
          totalAmt = Number((totalAmt + finalTot).toFixed(2));

          return {
            ...o,
            originalBaseAmount: originalBase,
            baseAmount: originalBase,
            discountAmount: disc,
            taxableAmount: taxable,
            sgstAmount: sgst,
            cgstAmount: cgst,
            totalAmount: finalTot
          };
        }
      });

      return {
        ...day,
        totalOrders: mappedOrders.length,
        completedOrders: completed,
        cancelledOrders: cancelled,
        totalBaseAmount: totalBase,
        totalDiscountAmount: totalDiscount,
        totalTaxableAmount: totalTaxable,
        totalSgstAmount: totalSgst,
        totalCgstAmount: totalCgst,
        totalAmount: totalAmt,
        orders: mappedOrders,
      };
    }).filter(day => day.orders.length > 0);

    let grandBase = 0;
    let grandDiscount = 0;
    let grandTaxable = 0;
    let grandSgst = 0;
    let grandCgst = 0;
    let grandTotal = 0;
    let totalCompleted = 0;
    let totalCancelled = 0;
    let totalOrdCount = 0;

    days.forEach(d => {
      grandBase = Number((grandBase + d.totalBaseAmount).toFixed(2));
      grandDiscount = Number((grandDiscount + (d.totalDiscountAmount || 0)).toFixed(2));
      grandTaxable = Number((grandTaxable + (d.totalTaxableAmount || 0)).toFixed(2));
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
      totalDiscountAmount: grandDiscount,
      totalTaxableAmount: grandTaxable,
      totalSgstAmount: grandSgst,
      totalCgstAmount: grandCgst,
      grandTotalAmount: grandTotal,
      days,
    };
  }, [data, dailyBillSearch, dailyBillStatusFilter, dailyBillPaymentFilter]);



  return (
    <section className="space-y-4 sm:space-y-6">
              <DateRangeFilter
                title="Restaurant Bill Summary (Daily Orders & 5% GST Breakdown)"
                icon={FileSpreadsheet}
                iconColor="text-emerald-400"
                color={{ bgLight: 'bg-emerald-500/20', text: 'text-emerald-400', bgHover: 'bg-emerald-500/30', border: 'border-emerald-500/50' }}
                startDate={dateRange.start}
                setStartDate={(v: string) => { setDateRange(prev => ({ ...prev, start: v })); setError(null); }}
                endDate={dateRange.end}
                setEndDate={(v: string) => { setDateRange(prev => ({ ...prev, end: v })); setError(null); }}
                onGenerate={() => fetchData()}
                loading={loading}
                setDateRangeType={setPresetDateRange}
                error={error}
                onDownload={() => downloadDailyBillReport(filteredDailyBills, dateRange)}
                onPrint={() => printDailyBillReport(filteredDailyBills, dateRange)}
                hasData={!!filteredDailyBills && (filteredDailyBills.totalOrders > 0)}
              />

              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredDailyBills ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Summary Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                    <StatCard
                      title="Total Orders"
                      value={`${filteredDailyBills.totalOrders}`}
                      icon={Receipt}
                      color="bg-purple-500"
                    />
                    <StatCard
                      title="Total Base Amount"
                      value={`₹${Number(filteredDailyBills.totalBaseAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      icon={IndianRupee}
                      color="bg-blue-500"
                    />
                    <StatCard
                      title="Total Discount"
                      value={`₹${Number(filteredDailyBills.totalDiscountAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      icon={Tag}
                      color="bg-rose-500"
                    />
                    <StatCard
                      title="Taxable Amount"
                      value={`₹${Number(filteredDailyBills.totalTaxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      icon={IndianRupee}
                      color="bg-teal-500"
                    />
                    <StatCard
                      title="SGST (2.5%)"
                      value={`₹${Number(filteredDailyBills.totalSgstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      icon={Receipt}
                      color="bg-amber-500"
                    />
                    <StatCard
                      title="CGST (2.5%)"
                      value={`₹${Number(filteredDailyBills.totalCgstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      icon={Receipt}
                      color="bg-orange-500"
                    />
                    <StatCard
                      title="Grand Total"
                      value={`₹${Number(filteredDailyBills.grandTotalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      icon={IndianRupee}
                      color="bg-emerald-500"
                      highlight
                      className="sm:col-span-2 lg:col-span-2"
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
                            type="button"
                            onClick={() => setDailyBillStatusFilter(st)}
                            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${dailyBillStatusFilter === st
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
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
                      <table className="w-full text-sm text-left text-slate-300 min-w-[950px] relative">
                        <thead className="text-xs text-slate-400 uppercase bg-black/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-20">
                          <tr>
                            <th scope="col" className="px-3 py-3.5 w-12 text-center">Ser No</th>
                            <th scope="col" className="px-3 py-3.5 w-20 text-center">Bill No</th>
                            <th scope="col" className="px-3 py-3.5 text-center">Date</th>
                            <th scope="col" className="px-3 py-3.5 text-right">Amount (Base)</th>
                            <th scope="col" className="px-3 py-3.5 text-right text-rose-400">Discount</th>
                            <th scope="col" className="px-3 py-3.5 text-right text-teal-400">Taxable Amt</th>
                            <th scope="col" className="px-3 py-3.5 text-right">SGST (2.5%)</th>
                            <th scope="col" className="px-3 py-3.5 text-right">CGST (2.5%)</th>
                            <th scope="col" className="px-3 py-3.5 text-right text-emerald-400">Total Amount</th>
                            <th scope="col" className="px-3 py-3.5 text-left">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-xs">
                          {filteredDailyBills.days.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="px-6 py-12 text-center text-slate-500 font-sans">
                                {dailyBillSearch ? 'No bills match your search filter.' : 'No restaurant orders found in this date range.'}
                              </td>
                            </tr>
                          ) : (
                            (() => {
                              return filteredDailyBills.days.map((day) => {
                                let rowSerNo = 1;
                                return (
                                  <React.Fragment key={day.dateKey}>
                                    {/* Day Group Header */}
                                    <tr className="bg-slate-800/80 border-y border-white/10 font-sans sticky z-10">
                                      <td colSpan={10} className="px-4 py-2.5 font-bold text-white text-xs">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                          <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-emerald-400" />
                                            <span className="text-sm font-bold text-emerald-300">{day.dateHeaderStr}</span>
                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-normal">
                                              {day.totalOrders} Orders
                                            </span>
                                          </div>
                                          <div className="text-[11px] font-medium text-slate-300 flex items-center gap-3 flex-wrap">
                                            <span>Base: <strong className="text-white font-mono">₹{day.totalBaseAmount.toFixed(2)}</strong></span>
                                            {day.totalDiscountAmount > 0 && (
                                              <span>Discount: <strong className="text-rose-400 font-mono">-₹{day.totalDiscountAmount.toFixed(2)}</strong></span>
                                            )}
                                            <span>Taxable: <strong className="text-teal-300 font-mono">₹{day.totalTaxableAmount.toFixed(2)}</strong></span>
                                            <span>GST: <strong className="text-amber-300 font-mono">₹{(day.totalSgstAmount + day.totalCgstAmount).toFixed(2)}</strong></span>
                                            <span>Total: <strong className="text-emerald-400 font-mono">₹{day.totalAmount.toFixed(2)}</strong></span>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Orders for this day */}
                                    {day.orders.map((order) => {
                                      const isCancelled = order.status === 'CANCELLED';
                                      const disc = Number(order.discountAmount || 0);
                                      const ser = String(rowSerNo++).padStart(2, '0');

                                      return (
                                        <tr
                                          key={`bill-row-${order.id}`}
                                          className={`hover:bg-white/5 transition-colors ${isCancelled ? 'opacity-60 bg-red-500/5' : ''}`}
                                        >
                                          <td className="px-3 py-2.5 text-center text-slate-500 font-semibold">{ser}.</td>
                                          <td className="px-3 py-2.5 text-center font-bold text-white tracking-wide">
                                            {order.billNo}
                                          </td>
                                          <td className="px-3 py-2.5 text-center text-slate-300">
                                            {order.dateStr}
                                          </td>
                                          <td className="px-3 py-2.5 text-right font-medium text-slate-200">
                                            {isCancelled ? (
                                              <span className="text-rose-400 font-bold font-sans text-[11px] px-1.5 py-0.5 rounded bg-rose-500/10">cancel</span>
                                            ) : (
                                              `₹${Number(order.baseAmount).toFixed(2)}`
                                            )}
                                          </td>
                                          <td className="px-3 py-2.5 text-right font-medium text-rose-400">
                                            {isCancelled ? '-' : (disc > 0 ? `₹${disc.toFixed(2)}` : '-')}
                                          </td>
                                          <td className="px-3 py-2.5 text-right font-medium text-teal-300">
                                            {isCancelled ? '-' : `₹${Number(order.taxableAmount).toFixed(2)}`}
                                          </td>
                                          <td className="px-3 py-2.5 text-right text-amber-400/90 font-medium">
                                            {isCancelled ? '-' : `₹${Number(order.sgstAmount).toFixed(2)}`}
                                          </td>
                                          <td className="px-3 py-2.5 text-right text-amber-400/90 font-medium">
                                            {isCancelled ? '-' : `₹${Number(order.cgstAmount).toFixed(2)}`}
                                          </td>
                                          <td className="px-3 py-2.5 text-right font-bold text-emerald-400">
                                            {isCancelled ? '-' : `₹${Number(order.totalAmount).toFixed(2)}`}
                                          </td>
                                          <td className="px-3 py-2.5 text-left font-sans text-xs">
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
                                      <td colSpan={3} className="px-3 py-2 text-right text-slate-400 font-sans text-xs">
                                        Subtotal ({day.dateStr}):
                                      </td>
                                      <td className="px-3 py-2 text-right text-slate-200">
                                        ₹{day.totalBaseAmount.toFixed(2)}
                                      </td>
                                      <td className="px-3 py-2 text-right text-rose-400">
                                        {day.totalDiscountAmount > 0 ? `₹${day.totalDiscountAmount.toFixed(2)}` : '-'}
                                      </td>
                                      <td className="px-3 py-2 text-right text-teal-300">
                                        ₹{day.totalTaxableAmount.toFixed(2)}
                                      </td>
                                      <td className="px-3 py-2 text-right text-amber-400">
                                        ₹{day.totalSgstAmount.toFixed(2)}
                                      </td>
                                      <td className="px-3 py-2 text-right text-amber-400">
                                        ₹{day.totalCgstAmount.toFixed(2)}
                                      </td>
                                      <td className="px-3 py-2 text-right text-emerald-400 text-sm font-black">
                                        ₹{day.totalAmount.toFixed(2)}
                                      </td>
                                      <td className="px-3 py-2 text-slate-400 font-sans text-[11px]">
                                        {day.completedOrders} Completed
                                      </td>
                                    </tr>
                                  </React.Fragment>
                                );
                              });
                            })())}
                        </tbody>
                        {filteredDailyBills.days.length > 0 && (
                          <tfoot className="bg-black/90 backdrop-blur-md border-t-2 border-emerald-500/40 text-white sticky bottom-0 z-20 font-mono text-xs font-bold">
                            <tr>
                              <td colSpan={3} className="px-3 py-3.5 text-right font-sans text-xs uppercase tracking-wider text-emerald-400">
                                Grand Total:
                              </td>
                              <td className="px-3 py-3.5 text-right text-white">
                                ₹{filteredDailyBills.totalBaseAmount.toFixed(2)}
                              </td>
                              <td className="px-3 py-3.5 text-right text-rose-400">
                                ₹{filteredDailyBills.totalDiscountAmount.toFixed(2)}
                              </td>
                              <td className="px-3 py-3.5 text-right text-teal-300">
                                ₹{filteredDailyBills.totalTaxableAmount.toFixed(2)}
                              </td>
                              <td className="px-3 py-3.5 text-right text-amber-400">
                                ₹{filteredDailyBills.totalSgstAmount.toFixed(2)}
                              </td>
                              <td className="px-3 py-3.5 text-right text-amber-400">
                                ₹{filteredDailyBills.totalCgstAmount.toFixed(2)}
                              </td>
                              <td className="px-3 py-3.5 text-right text-emerald-400 text-base font-black">
                                ₹{filteredDailyBills.grandTotalAmount.toFixed(2)}
                              </td>
                              <td className="px-3 py-3.5 font-sans text-xs text-slate-300">
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
                              <span className="text-[10px] text-slate-400">Taxable: ₹{day.totalTaxableAmount.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="p-3 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                            {day.orders.map((order) => {
                              const isCancelled = order.status === 'CANCELLED';
                              const disc = Number(order.discountAmount || 0);
                              return (
                                <div
                                  key={`mob-order-${order.id}`}
                                  className={`p-3 rounded-xl border transition-colors ${isCancelled ? 'bg-rose-500/5 border-rose-500/20' : 'bg-black/30 border-white/5'
                                    }`}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-mono font-bold text-white">{order.billNo}</span>
                                      <span className="text-[10px] text-slate-400">&bull; {order.dateStr}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isCancelled
                                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      }`}>
                                      {isCancelled ? 'CANCELLED' : (order.paymentMode || 'PAID')}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-6 gap-1 text-[11px] font-mono py-1.5 border-y border-white/5 text-center">
                                    <div>
                                      <span className="text-[9px] text-slate-500 font-sans block">Base</span>
                                      <span className="text-slate-300">{isCancelled ? '-' : `₹${order.baseAmount.toFixed(2)}`}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-slate-500 font-sans block">Disc.</span>
                                      <span className="text-rose-400">{isCancelled ? '-' : (disc > 0 ? `₹${disc.toFixed(2)}` : '-')}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-slate-500 font-sans block">Taxable</span>
                                      <span className="text-teal-300">{isCancelled ? '-' : `₹${order.taxableAmount.toFixed(2)}`}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-slate-500 font-sans block">SGST</span>
                                      <span className="text-amber-400">{isCancelled ? '-' : `₹${order.sgstAmount.toFixed(2)}`}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-slate-500 font-sans block">CGST</span>
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

  );
};
