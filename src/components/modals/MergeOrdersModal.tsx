import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Loader2, GitMerge, UtensilsCrossed, Check, Clock, 
  User, AlertCircle, ChevronDown, ChevronUp, Sparkles, RefreshCw, 
  ArrowRight, CheckSquare, Square, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch } from '../../store/hooks';
import { mergeOrders, Order } from '../../store/slices/orderSlice';
import { fetcher } from '../../lib/fetcher';

interface MergeOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TableGroup {
  tableNumber: number;
  orders: Order[];
  totalAmount: number;
  totalItemsCount: number;
  waiterNames: string[];
  createdAt: string;
}

export default function MergeOrdersModal({ isOpen, onClose, onSuccess }: MergeOrdersModalProps) {
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pending orders fetched from server
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  
  // Selected table numbers
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  
  // Target table number input
  const [targetTableInput, setTargetTableInput] = useState<string>('');
  
  // Show detailed items breakdown toggle
  const [showItemBreakdown, setShowItemBreakdown] = useState(false);

  // Fetch pending orders when modal opens
  const fetchPendingTableOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetcher.getOrders({ status: 'PENDING', limit: 100 });
      const ordersList: Order[] = Array.isArray(response) ? response : (response?.data || []);
      
      // Filter out orders without table numbers or invalid table numbers
      const validTableOrders = ordersList.filter(
        o => o.status === 'PENDING' && o.tableNumber !== null && o.tableNumber !== undefined && Number(o.tableNumber) > 0
      );
      
      setPendingOrders(validTableOrders);
    } catch (err: any) {
      console.error('Failed to fetch pending orders', err);
      setError('Unable to load pending orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedTables([]);
      setTargetTableInput('');
      setShowItemBreakdown(false);
      setError(null);
      fetchPendingTableOrders();
    }
  }, [isOpen]);

  // Group pending orders by tableNumber
  const tableGroups = useMemo<TableGroup[]>(() => {
    const map = new Map<number, Order[]>();
    for (const order of pendingOrders) {
      const tbl = Number(order.tableNumber);
      if (!map.has(tbl)) {
        map.set(tbl, []);
      }
      map.get(tbl)!.push(order);
    }

    const groups: TableGroup[] = [];
    map.forEach((orders, tableNumber) => {
      const totalAmount = orders.reduce((sum, o) => sum + Number(o.finalDiscountedAmount || 0), 0);
      const totalItemsCount = orders.reduce((sum, o) => {
        const items = Array.isArray(o.items) ? o.items : [];
        return sum + items.reduce((iSum: number, item: any) => iSum + Number(item.quantity || 0), 0);
      }, 0);

      const waiters = Array.from(new Set(orders.map(o => o.user?.name).filter(Boolean))) as string[];
      const earliestCreated = orders.reduce((earliest, o) => {
        return new Date(o.createdAt) < new Date(earliest) ? o.createdAt : earliest;
      }, orders[0]?.createdAt || new Date().toISOString());

      groups.push({
        tableNumber,
        orders,
        totalAmount,
        totalItemsCount,
        waiterNames: waiters,
        createdAt: earliestCreated,
      });
    });

    // Sort by tableNumber ascending
    return groups.sort((a, b) => a.tableNumber - b.tableNumber);
  }, [pendingOrders]);

  // Toggle selection for a table
  const handleToggleTable = (tableNumber: number) => {
    setSelectedTables(prev => {
      const isSelected = prev.includes(tableNumber);
      let updated: number[];
      if (isSelected) {
        updated = prev.filter(t => t !== tableNumber);
      } else {
        updated = [...prev, tableNumber];
      }

      // If user hasn't explicitly set a target table, or previous target table is deselected,
      // intelligently suggest the first selected table
      if (updated.length > 0 && (!targetTableInput || !updated.includes(Number(targetTableInput)))) {
        // Keep current input if user typed something custom, else default to first table
      }
      return updated;
    });
  };

  const handleSelectAll = () => {
    if (selectedTables.length === tableGroups.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(tableGroups.map(g => g.tableNumber));
    }
  };

  // Extract selected orders
  const selectedOrders = useMemo(() => {
    return pendingOrders.filter(o => o.tableNumber && selectedTables.includes(Number(o.tableNumber)));
  }, [pendingOrders, selectedTables]);

  // Merged items preview calculation
  const mergedPreview = useMemo(() => {
    if (selectedOrders.length < 2) return null;

    const itemsMap = new Map<string, { menuItemId: number; name: string; price: number; quantity: number }>();

    for (const order of selectedOrders) {
      const items: any[] = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const qty = Number(item.quantity || 0);
        if (qty <= 0) continue;
        const price = Number(item.price || 0);
        const menuItemId = item.menuItemId ? Number(item.menuItemId) : 0;
        const name = String(item.name || '').trim();

        const key = menuItemId > 0 ? `menu_${menuItemId}` : `custom_${name.toLowerCase()}_${price}`;

        if (itemsMap.has(key)) {
          itemsMap.get(key)!.quantity += qty;
        } else {
          itemsMap.set(key, { menuItemId, name, price, quantity: qty });
        }
      }
    }

    const mergedItems = Array.from(itemsMap.values());
    const baseAmount = Number(mergedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2));
    const gstAmount = Number((baseAmount * 0.05).toFixed(2));
    const totalDiscount = selectedOrders.reduce((sum, o) => sum + Number(o.discountAmount || 0), 0);
    const finalAmount = Math.max(0, Math.round(baseAmount + gstAmount - totalDiscount));
    const totalQty = mergedItems.reduce((sum, i) => sum + i.quantity, 0);

    return {
      items: mergedItems,
      baseAmount,
      gstAmount,
      totalDiscount,
      finalAmount,
      totalQty,
    };
  }, [selectedOrders]);

  const targetTableNum = parseInt(targetTableInput.trim(), 10);
  const isValidTarget = !isNaN(targetTableNum) && targetTableNum > 0;
  const isTargetAlreadyPending = isValidTarget && tableGroups.some(g => g.tableNumber === targetTableNum && !selectedTables.includes(targetTableNum));

  const formatElapsedTime = (dateString: string) => {
    try {
      const diffMs = Date.now() - new Date(dateString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ago`;
    } catch {
      return '';
    }
  };

  const handleMergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedTables.length < 2) {
      setError('Please select at least 2 tables to merge.');
      return;
    }

    if (!isValidTarget) {
      setError('Please enter a valid target table number (e.g. 1).');
      return;
    }

    const orderIdsToMerge = selectedOrders.map(o => o.id);
    if (orderIdsToMerge.length < 2) {
      setError('At least 2 pending orders are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(mergeOrders({
        orderIds: orderIdsToMerge,
        targetTableNumber: targetTableNum,
      })).unwrap();

      toast.success(
        `Successfully merged Table ${selectedTables.join(', ')} into Table ${targetTableNum}!`,
        { duration: 4000 }
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Merge error:', err);
      const msg = typeof err === 'string' ? err : (err?.message || 'Failed to merge orders. Please try again.');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-surface border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]"
        >
          {/* ========================================================================= */}
          {/* 1. HEADER                                                                 */}
          {/* ========================================================================= */}
          <div className="flex justify-between items-center p-4 md:p-5 border-b border-white/10 bg-white/[0.03] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                <GitMerge size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg md:text-xl font-black text-slate-100 tracking-tight">Merge Table Orders</h2>
                  <span className="bg-violet-500/15 text-violet-300 border border-violet-500/30 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                    Table POS
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Select multiple pending tables to combine items into a single consolidated table order.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-xl hover:bg-white/5 disabled:opacity-50 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* 2. BODY CONTENT (SCROLLABLE)                                              */}
          {/* ========================================================================= */}
          <form onSubmit={handleMergeSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 md:p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
              {error && (
                <div className="p-3.5 bg-danger/10 border border-danger/30 rounded-xl text-danger text-xs md:text-sm flex items-start gap-2.5">
                  <AlertCircle size={17} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* --------------------------------------------------------------------- */}
              {/* STEP 1: SELECT TABLES                                                 */}
              {/* --------------------------------------------------------------------- */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary border border-primary/40 text-[11px] font-black">
                      1
                    </span>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Select Pending Tables to Merge
                    </label>
                    <span className="text-[11px] text-slate-400">
                      ({selectedTables.length} of {tableGroups.length} selected)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchPendingTableOrders}
                      disabled={loading}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-white/5 cursor-pointer disabled:opacity-50"
                      title="Refresh pending tables"
                    >
                      <RefreshCw size={12} className={loading ? 'animate-spin text-primary' : ''} />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>
                    {tableGroups.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10 cursor-pointer"
                      >
                        {selectedTables.length === tableGroups.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 size={24} className="animate-spin text-primary" />
                    <span className="text-xs font-semibold">Loading pending table orders...</span>
                  </div>
                ) : tableGroups.length === 0 ? (
                  <div className="py-10 px-4 rounded-xl border border-dashed border-white/10 bg-black/20 text-center">
                    <UtensilsCrossed size={28} className="mx-auto text-slate-500 mb-2" />
                    <p className="text-sm font-bold text-slate-300">No Pending Table Orders Found</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Only active pending orders with assigned table numbers can be merged. Orders without a table cannot be merged.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {tableGroups.map(group => {
                      const isSelected = selectedTables.includes(group.tableNumber);
                      const firstOrder = group.orders[0];
                      const itemsPreview = (firstOrder?.items || [])
                        .slice(0, 2)
                        .map((i: any) => `${i.name} (×${i.quantity})`)
                        .join(', ');
                      const remainingItems = Math.max(0, group.totalItemsCount - 2);

                      return (
                        <div
                          key={group.tableNumber}
                          onClick={() => handleToggleTable(group.tableNumber)}
                          className={`relative p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                            isSelected
                              ? 'bg-violet-600/15 border-violet-500/60 shadow-[0_0_15px_rgba(139,92,246,0.15)] ring-1 ring-violet-500/40'
                              : 'bg-black/30 border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${
                                  isSelected
                                    ? 'bg-primary border-primary text-white'
                                    : 'border-white/20 bg-black/40 text-transparent'
                                }`}
                              >
                                <Check size={13} strokeWidth={3} />
                              </div>
                              <span className="inline-flex items-center gap-1.5 font-mono font-black text-xs px-2.5 py-0.5 rounded-md bg-primary text-white shadow-sm">
                                <UtensilsCrossed size={11} className="text-purple-200" />
                                Table {group.tableNumber}
                              </span>
                              {group.orders.length > 1 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                                  {group.orders.length} orders
                                </span>
                              )}
                            </div>

                            <span className="font-mono font-bold text-sm text-slate-100">
                              ₹{Math.round(group.totalAmount).toLocaleString()}
                            </span>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                            <div className="flex items-center gap-1 truncate max-w-[65%]">
                              <span className="truncate">
                                {itemsPreview}
                                {remainingItems > 0 ? ` +${remainingItems} more` : ''}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-slate-400 shrink-0">
                              <Clock size={11} />
                              <span>{formatElapsedTime(group.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* --------------------------------------------------------------------- */}
              {/* STEP 2: TARGET TABLE DESTINATION                                      */}
              {/* --------------------------------------------------------------------- */}
              {tableGroups.length > 0 && (
                <div className="bg-black/30 border border-white/10 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary border border-primary/40 text-[11px] font-black">
                        2
                      </span>
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Target Table Destination
                      </label>
                    </div>
                    <span className="text-[11px] text-slate-400">Where should merged items be placed?</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-black text-xs">
                          Table
                        </span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={targetTableInput}
                          onChange={(e) => setTargetTableInput(e.target.value)}
                          placeholder="e.g. 1"
                          className="w-full bg-surface border border-white/15 rounded-xl pl-16 pr-3.5 py-2.5 text-sm font-mono font-bold text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                      </div>

                      {/* Quick Choice Pills from selected tables */}
                      {selectedTables.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase shrink-0">Or pick:</span>
                          {selectedTables.map(tbl => (
                            <button
                              key={tbl}
                              type="button"
                              onClick={() => setTargetTableInput(String(tbl))}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-black transition-all cursor-pointer border ${
                                targetTableInput === String(tbl)
                                  ? 'bg-primary text-white border-primary shadow-sm'
                                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                              }`}
                            >
                              Table {tbl}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {isTargetAlreadyPending && (
                      <div className="text-[11px] text-amber-300 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
                        <Info size={13} className="shrink-0" />
                        <span>
                          Notice: Table {targetTableNum} already has an active pending order not included in this selection. It will remain separate.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --------------------------------------------------------------------- */}
              {/* STEP 3: CONSOLIDATED PREVIEW                                          */}
              {/* --------------------------------------------------------------------- */}
              {mergedPreview && selectedTables.length >= 2 && isValidTarget && (
                <div className="bg-gradient-to-br from-violet-900/20 to-primary/10 border border-violet-500/30 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={15} className="text-violet-400" />
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Merge Summary Preview
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowItemBreakdown(!showItemBreakdown)}
                      className="text-xs text-violet-300 hover:text-white flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                    >
                      <span>{showItemBreakdown ? 'Hide Items' : 'View Combined Items'}</span>
                      {showItemBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {/* Flow visualization */}
                  <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-slate-400 font-semibold">Source:</span>
                      {selectedTables.map((tbl, idx) => (
                        <React.Fragment key={tbl}>
                          <span className="px-2 py-0.5 rounded bg-white/10 font-mono font-bold text-xs text-slate-200">
                            Table {tbl}
                          </span>
                          {idx < selectedTables.length - 1 && <span className="text-slate-500 font-bold">+</span>}
                        </React.Fragment>
                      ))}
                    </div>

                    <ArrowRight size={16} className="text-violet-400 mx-2 shrink-0" />

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-semibold">New:</span>
                      <span className="px-2.5 py-1 rounded-lg bg-primary font-mono font-black text-xs text-white shadow-md">
                        Table {targetTableNum}
                      </span>
                    </div>
                  </div>

                  {/* Breakdown summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="bg-black/30 border border-white/5 rounded-lg p-2">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Items</div>
                      <div className="font-mono font-bold text-slate-100 text-sm mt-0.5">
                        {mergedPreview.totalQty} total ({mergedPreview.items.length} types)
                      </div>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-lg p-2">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Subtotal</div>
                      <div className="font-mono font-bold text-slate-100 text-sm mt-0.5">
                        ₹{mergedPreview.baseAmount.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-lg p-2">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">GST (5%)</div>
                      <div className="font-mono font-bold text-slate-100 text-sm mt-0.5">
                        ₹{mergedPreview.gstAmount.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-violet-500/15 border border-violet-500/30 rounded-lg p-2">
                      <div className="text-[10px] text-violet-300 uppercase font-black">Final Total</div>
                      <div className="font-mono font-black text-violet-200 text-base mt-0.5">
                        ₹{mergedPreview.finalAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Expandable item table */}
                  {showItemBreakdown && (
                    <div className="mt-2 border-t border-white/10 pt-2 space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                      <div className="text-[11px] font-bold text-slate-300 mb-1">Combined Menu Items:</div>
                      {mergedPreview.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded bg-black/20 border border-white/5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-primary">×{item.quantity}</span>
                            <span className="text-slate-200 font-semibold">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-[11px]">@ ₹{item.price}</span>
                            <span className="font-mono font-bold text-slate-100">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* 3. FOOTER ACTIONS                                                         */}
            {/* ========================================================================= */}
            <div className="p-4 md:p-5 border-t border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-slate-400 text-center sm:text-left">
                {selectedTables.length < 2 ? (
                  <span className="text-amber-400/90 font-medium">Select at least 2 tables to proceed</span>
                ) : !isValidTarget ? (
                  <span className="text-amber-400/90 font-medium">Specify a target table number</span>
                ) : (
                  <span>
                    Old orders for Table {selectedTables.join(', ')} will be deleted and replaced with a single new order for Table {targetTableNum}.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || selectedTables.length < 2 || !isValidTarget}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-primary shadow-[0_4px_14px_0_var(--color-primary-light)] hover:bg-primary-hover active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Merging Orders...</span>
                    </>
                  ) : (
                    <>
                      <GitMerge size={15} />
                      <span>Merge {selectedTables.length > 1 ? `${selectedTables.length} Tables` : 'Orders'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
