import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  UtensilsCrossed,
  ShoppingBag,
  Search,
  ArrowUpDown,
  IndianRupee,
} from 'lucide-react';
import { DateRangeFilter } from '../../common/DateRangeFilter';
import { StatCard } from '../../common/StatCard';
import { getLocalDateString } from '../../common/dateUtils';
import {
  getOrderItemAnalysis,
  OrderItemAnalysis,
} from '../../../../../lib/analysis';
import {
  downloadOrderItemReport,
  printOrderItemReport,
} from '../restaurantReports';

export const OrderItemsSection: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    end: getLocalDateString(new Date()),
  });
  const [data, setData] = useState<OrderItemAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [itemSortBy, setItemSortBy] = useState<'quantity' | 'amount' | 'name'>('quantity');

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
      const result = await getOrderItemAnalysis(start, end);
      setData(result);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to fetch order items analysis';
      setError(msg);
      console.error('Failed to fetch order items analysis', err);
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

  const filteredOrderItems = useMemo(() => {
    if (!data?.items) return [];
    let list = [...data.items];

    if (itemSearchQuery.trim()) {
      const q = itemSearchQuery.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }

    if (itemSortBy === 'quantity') {
      list.sort((a, b) => b.totalQuantity - a.totalQuantity);
    } else if (itemSortBy === 'amount') {
      list.sort((a, b) => b.totalAmount - a.totalAmount);
    } else if (itemSortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [data, itemSearchQuery, itemSortBy]);

  return (
    <section className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 border-t border-white/5">
              <DateRangeFilter
                title="Restaurant Order Items (Excl. GST)"
                icon={UtensilsCrossed}
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
                onDownload={() => downloadOrderItemReport(data, dateRange)}
                onPrint={() => printOrderItemReport(data, dateRange)}
                hasData={!!data && (data.items?.length ?? 0) > 0}
              />

              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : data ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    <StatCard
                      title="Total Items Sold"
                      value={`${data.totalItemsSold || 0} pcs`}
                      icon={ShoppingBag}
                      color="bg-emerald-500"
                    />
                    <StatCard
                      title="Unique Dishes Ordered"
                      value={`${data.totalUniqueItems || 0} items`}
                      icon={UtensilsCrossed}
                      color="bg-blue-500"
                    />
                    <StatCard
                      title="Total Amount (Excl. GST)"
                      value={`₹${Number(data.totalAmountExcludingGst || 0).toFixed(2)}`}
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
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${itemSortBy === 'quantity'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5'
                            }`}
                        >
                          Quantity
                        </button>
                        <button
                          onClick={() => setItemSortBy('amount')}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${itemSortBy === 'amount'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5'
                            }`}
                        >
                          Total Price
                        </button>
                        <button
                          onClick={() => setItemSortBy('name')}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${itemSortBy === 'name'
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
                            const maxQty = Math.max(...data!.items.map(i => i.totalQuantity), 1);
                            const progressPercent = Math.round((item.totalQuantity / maxQty) * 100);
                            const sharePercent = ((item.totalAmount / (data?.totalAmountExcludingGst || 1)) * 100).toFixed(1);

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
                            <span>{data?.totalUniqueItems || 0} Unique Items</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-white/10">
                            <span className="text-emerald-400 font-bold text-sm">
                              {data?.totalItemsSold || 0} pcs sold
                            </span>
                            <span className="text-emerald-400 text-lg font-black font-mono">
                              ₹{Number(data?.totalAmountExcludingGst || 0).toFixed(2)}
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
                              const maxQty = Math.max(...data!.items.map(i => i.totalQuantity), 1);
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
                                      {((item.totalAmount / (data?.totalAmountExcludingGst || 1)) * 100).toFixed(1)}% of total
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
                                Grand Total ({data?.totalUniqueItems || 0} Unique Items)
                              </td>
                              <td className="px-6 py-4 text-center text-emerald-400 font-bold">
                                {data?.totalItemsSold || 0} pcs
                              </td>
                              <td className="px-6 py-4 text-right text-emerald-400 text-lg font-black font-mono">
                                ₹{Number(data?.totalAmountExcludingGst || 0).toFixed(2)}
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

  );
};
