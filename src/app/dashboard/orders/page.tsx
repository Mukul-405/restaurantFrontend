'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, RefreshCw, Plus, Search, Eye, Edit2, ChevronDown, ChevronUp, 
  X, CheckCircle, Filter, Printer, Tag, UtensilsCrossed, LayoutGrid, 
  List, Clock, Flame, Calendar, Sparkles, Check, ArrowUpDown
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchOrders, Order, updateOrder } from '../../../store/slices/orderSlice';
import { fetcher } from '../../../lib/fetcher';
import OrderModal from '../../../components/modals/OrderModal';
import OrderDetailsModal from '../../../components/modals/OrderDetailsModal';
import CancelOrderModal from '../../../components/modals/CancelOrderModal';
import ReceiptModal from '../../../components/modals/ReceiptModal';
import DiscountModal from '../../../components/modals/DiscountModal';
import { printReceipt, printKOT } from '../../../utils/printReceipt';
import { ConfirmPrintModal } from '../../../components/modals/ConfirmPrintModal';
import { useAuth } from '../../../context/AuthContext';

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { orders, meta, status, error } = useAppSelector((state) => state.order);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<number | null>(null);
  const [orderToComplete, setOrderToComplete] = useState<Order | null>(null);
  const [orderToDiscount, setOrderToDiscount] = useState<Order | null>(null);
  
  // Date Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'CUSTOM'>('ALL');
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  // Status Filter - Default to PENDING as requested
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'COMPLETED' | 'CANCELLED' | 'ALL'>('PENDING');

  const [waiterFilter, setWaiterFilter] = useState<string>('ALL');
  const [waiters, setWaiters] = useState<{id: string; name: string}[]>([]);
  
  // High-Density POS View Mode: 'grid' (Compact Tiles) vs 'table' (Dense List)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Instant search input for quick lookup during rush hours
  const [searchQuery, setSearchQuery] = useState('');
  
  // Page limit for high traffic
  const [pageSize, setPageSize] = useState<number>(30);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState<number | string | null>(null);

  const toggleAccordion = (id: number | string) => {
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  useEffect(() => {
    fetcher.getUsers().then(data => setWaiters(data)).catch(console.error);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchOrdersData(1);
  }, [dispatch, statusFilter, waiterFilter, startDate, endDate, pageSize]);

  const fetchOrdersData = (page = currentPage) => {
    const params: any = {};
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (waiterFilter !== 'ALL') params.userId = waiterFilter;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    params.page = page;
    params.limit = pageSize;
    dispatch(fetchOrders(params));
  };

  const handleOpenCreate = () => {
    setSelectedOrder(null);
    setIsOrderModalOpen(true);
  };

  const handleOpenEdit = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleOpenDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const handleApplyPreset = (preset: 'ALL' | 'TODAY' | 'YESTERDAY' | 'CUSTOM') => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
      setIsDatePopoverOpen(false);
    } else if (preset === 'TODAY') {
      const todayStr = now.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
      setIsDatePopoverOpen(false);
    } else if (preset === 'YESTERDAY') {
      const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yStr = y.toISOString().split('T')[0];
      setStartDate(yStr);
      setEndDate(yStr);
      setIsDatePopoverOpen(false);
    } else {
      setIsDatePopoverOpen(true);
    }
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setDatePreset('ALL');
    setWaiterFilter('ALL');
    setStatusFilter('PENDING');
    setSearchQuery('');
    setCurrentPage(1);
    setIsDatePopoverOpen(false);
    
    dispatch(fetchOrders({ status: 'PENDING', page: 1, limit: pageSize }));
  };

  const [confirmKotModal, setConfirmKotModal] = useState<{ isOpen: boolean; orderId: number | null }>({ isOpen: false, orderId: null });

  const handlePrintKOTAction = (order: Order) => {
    const success = printKOT(order);
    if (success && order.kotHistory && order.kotHistory.length > 0) {
      setConfirmKotModal({ isOpen: true, orderId: order.id });
    }
  };

  const handleConfirmKotResult = async (didPrint: boolean) => {
    if (didPrint && confirmKotModal.orderId) {
      try {
        await dispatch(updateOrder({
          id: confirmKotModal.orderId,
          data: { kotHistory: [] }
        })).unwrap();
        fetchOrdersData(currentPage);
      } catch (err) {
        console.error('Failed to clear KOT status', err);
      }
    }
    setConfirmKotModal({ isOpen: false, orderId: null });
  };

  const handleCompleteOrder = async (amounts: {
    baseAmount: number;
    gstAmount: number;
    discountAmount: number;
    finalDiscountedAmount: number;
    paymentMode: 'CASH' | 'CARD' | 'UPI';
  }) => {
    if (!orderToComplete) return;
    await dispatch(updateOrder({ 
      id: orderToComplete.id, 
      data: { status: 'COMPLETED', ...amounts } 
    })).unwrap();
    fetchOrdersData(currentPage);
  };

  // Instant filter for quick search during rush hours
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(o => {
      const idMatch = String(o.id).includes(q);
      const tableMatch = o.tableNumber && String(o.tableNumber).toLowerCase().includes(q);
      const waiterMatch = o.user?.name && o.user.name.toLowerCase().includes(q);
      const itemMatch = Array.isArray(o.items) && o.items.some((i: any) => i.name && i.name.toLowerCase().includes(q));
      return idMatch || tableMatch || waiterMatch || itemMatch;
    });
  }, [orders, searchQuery]);

  // Quick stats summary
  const stats = useMemo(() => {
    const pending = orders.filter(o => o.status === 'PENDING');
    const pendingTotal = pending.reduce((sum, o) => sum + Math.round(Number(o.finalDiscountedAmount || 0)), 0);
    const completed = orders.filter(o => o.status === 'COMPLETED');
    const completedTotal = completed.reduce((sum, o) => sum + Math.round(Number(o.finalDiscountedAmount || 0)), 0);
    return {
      pendingCount: pending.length,
      pendingTotal,
      completedCount: completed.length,
      completedTotal,
      totalCount: orders.length
    };
  }, [orders]);

  const formatElapsedTime = (dateString: string) => {
    try {
      const diffMs = Date.now() - new Date(dateString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            PENDING
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase">
            COMPLETED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase">
            {status}
          </span>
        );
    }
  };

  const renderTableBadge = (tableNumber: string | number | undefined | null, status: string, compact: boolean = false) => {
    const isPending = status === 'PENDING';
    const rawStr = tableNumber ? String(tableNumber).trim() : '';
    const displayVal = rawStr 
      ? (rawStr.toLowerCase().startsWith('table') ? rawStr : `Table ${rawStr}`)
      : 'No Table';

    if (compact) {
      return (
        <span className={`inline-flex items-center gap-1 font-mono font-black rounded-md text-white border shadow-sm ${
          isPending 
            ? 'bg-primary text-white border-primary-light/50 px-2 py-0.5 text-xs shadow-[0_2px_8px_rgba(139,92,246,0.35)]' 
            : 'bg-slate-800 text-slate-200 border-slate-700 px-1.5 py-0.5 text-[11px]'
        }`}>
          {isPending && (
            <span className="relative flex h-1.5 w-1.5 mr-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
            </span>
          )}
          <UtensilsCrossed size={11} className="text-purple-200 shrink-0" />
          <span>{displayVal}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-primary text-white border border-primary-light/40 shadow-[0_2px_10px_0_rgba(139,92,246,0.4)]">
        {isPending && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
        )}
        <UtensilsCrossed size={12} className="text-purple-200" />
        <span>{displayVal}</span>
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: TITLE + STATS PILL + VIEW SWITCHER + NEW ORDER */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap justify-between items-center gap-3 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2.5">
            Orders
            {status === 'loading' && <Loader2 className="animate-spin text-primary" size={18} />}
          </h1>

          {/* Quick Rush Hour Stats Banner */}
          {statusFilter === 'PENDING' && (meta?.total ?? orders.length) > 0 ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1 text-xs text-amber-300 shadow-sm animate-pulse">
              <Flame size={13} className="text-amber-400" />
              <span className="font-bold">{meta?.total ?? orders.length} Pending</span>
              <span className="text-amber-500/60">&bull;</span>
              <span className="font-mono font-bold text-white">₹{stats.pendingTotal.toLocaleString()}</span>
            </div>
          ) : stats.pendingCount > 0 ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1 text-xs text-amber-300 shadow-sm">
              <Flame size={13} className="text-amber-400" />
              <span className="font-bold">{stats.pendingCount} Pending</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-slate-400">
              <CheckCircle size={13} className="text-emerald-400" />
              <span>All orders clear</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Orders Button */}
          <button
            type="button"
            onClick={() => fetchOrdersData(currentPage)}
            disabled={status === 'loading'}
            className="flex items-center justify-center p-2 md:px-3 md:py-2 rounded-xl bg-black/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all text-xs font-bold gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh Orders"
          >
            <RefreshCw size={15} className={`${status === 'loading' ? 'animate-spin text-primary' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* View Mode Switcher (POS High-Density Standard) */}
          <div className="hidden md:flex items-center bg-black/40 p-0.5 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Compact POS Grid Tiles View"
            >
              <LayoutGrid size={14} />
              <span>Tiles</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Ultra-Dense POS Table View (Zero Scrolling)"
            >
              <List size={14} />
              <span>List</span>
            </button>
          </div>

          {/* New Order Button */}
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-sans font-bold text-xs md:text-sm cursor-pointer transition-all duration-200 bg-primary text-white shadow-[0_4px_14px_0_var(--color-primary-light)] hover:bg-primary-hover active:scale-95"
          >
            <Plus size={16} />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. COMPACT FILTER TOOLBAR (REMOVED BULKY 120px CONTAINER) */}
      {/* ========================================================================= */}
      <div className="bg-surface/60 border border-white/10 rounded-2xl p-2.5 md:p-3 flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between shrink-0 shadow-sm">
        {/* Left: Status Filter Pills with live counts */}
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 overflow-x-auto custom-scrollbar shrink-0">
          {(['PENDING', 'COMPLETED', 'CANCELLED', 'ALL'] as const).map((tab) => {
            const isSelected = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <span>{tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
                {isSelected && meta?.total !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-white/20 text-white font-black">
                    {meta.total}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Center/Right: Live Search + Waiter Filter + Collapsible Date Popover */}
        <div className="flex flex-wrap items-center gap-2 flex-1 md:justify-end">
          {/* Fast Search Input */}
          <div className="relative flex-1 sm:max-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table, order #..."
              className="w-full bg-black/40 border border-white/10 text-slate-200 pl-8 pr-7 py-1.5 rounded-xl font-sans text-xs outline-none focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Waiter Dropdown */}
          <select
            value={waiterFilter}
            onChange={(e) => setWaiterFilter(e.target.value)}
            className="bg-black/40 border border-white/10 text-slate-200 px-3 py-1.5 rounded-xl font-sans text-xs outline-none focus:border-primary cursor-pointer max-w-[130px]"
          >
            <option value="ALL">All Waiters</option>
            {waiters.map((w, index) => (
              <option key={w.id || `waiter-${index}`} value={w.id}>{w.name}</option>
            ))}
          </select>

          {/* Compact Date Presets & Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDatePopoverOpen(!isDatePopoverOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                startDate || endDate || datePreset !== 'ALL'
                  ? 'bg-primary/20 text-primary border-primary/40'
                  : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'
              }`}
            >
              <Calendar size={13} className="shrink-0" />
              <span>
                {datePreset === 'TODAY' ? 'Today' : datePreset === 'YESTERDAY' ? 'Yesterday' : startDate ? `${startDate.slice(5)} to ${endDate ? endDate.slice(5) : ''}` : 'Date'}
              </span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${isDatePopoverOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Date Popover Menu */}
            <AnimatePresence>
              {isDatePopoverOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  className="absolute right-0 top-full mt-2 w-72 bg-[#171923] border border-white/15 rounded-2xl shadow-2xl p-3 z-30 space-y-3"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-xs font-bold text-slate-200">Date Range</span>
                    {(startDate || endDate || datePreset !== 'ALL') && (
                      <button
                        onClick={handleResetFilters}
                        className="text-[11px] text-amber-400 hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('ALL')}
                      className={`py-1 rounded-lg text-xs font-semibold border ${datePreset === 'ALL' ? 'bg-primary text-white border-primary' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('TODAY')}
                      className={`py-1 rounded-lg text-xs font-semibold border ${datePreset === 'TODAY' ? 'bg-primary text-white border-primary' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('YESTERDAY')}
                      className={`py-1 rounded-lg text-xs font-semibold border ${datePreset === 'YESTERDAY' ? 'bg-primary text-white border-primary' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                    >
                      Yesterday
                    </button>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-white/5 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); setDatePreset('CUSTOM'); }}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-slate-200 font-mono text-xs focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => { setEndDate(e.target.value); setDatePreset('CUSTOM'); }}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-slate-200 font-mono text-xs focus:border-primary outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsDatePopoverOpen(false)}
                      className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-hover"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Reset button if any filter is dirty */}
          {(startDate || endDate || waiterFilter !== 'ALL' || statusFilter !== 'PENDING' || searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 rounded-xl text-xs font-bold transition-all"
              title="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN ORDERS LIST: COMPACT TILES OR HIGH-DENSITY TABLE */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-2">
        {status === 'loading' && orders.length === 0 ? (
          <div className="bg-surface/30 border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-400 min-h-[250px]">
            <Loader2 className="animate-spin text-primary mb-3" size={32} />
            <p className="text-xs font-bold uppercase tracking-wider">Loading orders...</p>
          </div>
        ) : status === 'failed' ? (
          <div className="bg-surface/30 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-400 min-h-[200px]">
            <p className="text-rose-400 mb-3 text-sm">{error || 'Failed to load orders'}</p>
            <button 
              onClick={() => fetchOrdersData()}
              className="flex items-center gap-2 text-primary hover:text-primary-hover font-semibold text-xs"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-surface/30 border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-400 min-h-[200px]">
            <p className="text-sm font-semibold">No orders found matching your filters.</p>
            {(searchQuery || startDate || endDate || waiterFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                onClick={handleResetFilters}
                className="mt-3 text-xs text-primary hover:underline font-bold"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* ========================================================================= */
          /* TABLE VIEW: ULTRA-DENSE HIGH-TRAFFIC RUSH-HOUR MODE (ZERO SCROLLING)     */
          /* ========================================================================= */
          <div className="bg-[#12141a]/90 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-black/40 text-[11px] uppercase tracking-wider text-slate-400 font-extrabold">
                    <th className="py-2.5 px-3">Table</th>
                    <th className="py-2.5 px-2.5">Order</th>
                    <th className="py-2.5 px-2.5">Time</th>
                    <th className="py-2.5 px-2.5">Items</th>
                    <th className="py-2.5 px-2.5 text-right">Total</th>
                    <th className="py-2.5 px-2.5 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {filteredOrders.map((order) => {
                    const totalRounded = Math.round(Number(order.finalDiscountedAmount ?? 0));
                    const itemsCount = Array.isArray(order.items) ? order.items.reduce((s: number, i: any) => s + (Number(i.quantity) || 1), 0) : 0;
                    const itemsSummary = Array.isArray(order.items) ? order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ') : '-';
                    const isPending = order.status === 'PENDING';

                    return (
                      <tr 
                        key={order.id}
                        className={`hover:bg-white/[0.04] transition-colors ${isPending ? 'bg-primary/[0.02]' : ''}`}
                      >
                        {/* Table */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          {renderTableBadge(order.tableNumber, order.status, true)}
                        </td>
                        {/* Order # & Waiter */}
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-200 text-xs">#{order.id}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[100px]">{order.user?.name || '-'}</div>
                        </td>
                        {/* Time */}
                        <td className="py-2 px-2.5 whitespace-nowrap text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock size={11} className="text-slate-500 shrink-0" />
                            {formatElapsedTime(order.createdAt)}
                          </span>
                        </td>
                        {/* Items */}
                        <td className="py-2 px-2.5 max-w-[200px] truncate text-slate-300" title={itemsSummary}>
                          <span className="font-semibold text-white mr-1.5 bg-white/10 px-1.5 py-0.2 rounded text-[10px]">
                            {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                          </span>
                          <span className="text-slate-400 text-[11px] truncate">{itemsSummary}</span>
                        </td>
                        {/* Total & Tax breakdown */}
                        <td className="py-2 px-2.5 text-right whitespace-nowrap font-mono">
                          <div className="font-black text-sm text-emerald-400">₹{totalRounded}</div>
                          <div className="text-[10px] text-slate-400">
                            Base ₹{order.baseAmount ?? 0} &bull; GST ₹{order.gstAmount ?? 0}
                            {Number(order.discountAmount) > 0 && (
                              <span className="text-emerald-400 font-bold ml-1">-₹{order.discountAmount}</span>
                            )}
                          </div>
                        </td>
                        {/* Status */}
                        <td className="py-2 px-2.5 text-center whitespace-nowrap">
                          {renderStatusBadge(order.status)}
                        </td>
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {order.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => setOrderToComplete(order)}
                                  className="h-7 px-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                  title="Complete and Settle Order"
                                >
                                  <CheckCircle size={12} />
                                  <span>Done</span>
                                </button>
                                <button
                                  onClick={() => handlePrintKOTAction(order)}
                                  className="h-7 px-2 flex items-center gap-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-[11px] font-bold transition-all cursor-pointer"
                                  title="Print Kitchen Order Ticket (KOT)"
                                >
                                  <Printer size={12} />
                                  <span>KOT</span>
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(order)}
                                  className="h-7 px-2 flex items-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[11px] font-semibold transition-all cursor-pointer"
                                  title="Edit Order"
                                >
                                  <Edit2 size={11} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => setOrderToDiscount(order)}
                                  className="h-7 px-2 flex items-center gap-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[11px] font-semibold transition-all cursor-pointer"
                                  title="Apply Discount"
                                >
                                  <Tag size={11} />
                                  <span>Disc</span>
                                </button>
                                <button
                                  onClick={() => handleOpenDetails(order)}
                                  className="h-7 px-2 flex items-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[11px] font-semibold transition-all cursor-pointer"
                                  title="View Details"
                                >
                                  <Eye size={11} />
                                  <span>View</span>
                                </button>
                                <button
                                  onClick={() => setOrderToCancel(order.id)}
                                  className="h-7 px-2 flex items-center gap-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] font-semibold transition-all cursor-pointer"
                                  title="Cancel Order"
                                >
                                  <X size={12} />
                                  <span>Cancel</span>
                                </button>
                              </>
                            )}

                            {order.status === 'COMPLETED' && (
                              <>
                                <button
                                  onClick={() => printReceipt(order)}
                                  className="h-7 px-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                  title="Print Customer Bill Receipt"
                                >
                                  <Printer size={12} />
                                  <span>Bill</span>
                                </button>
                                <button
                                  onClick={() => handlePrintKOTAction(order)}
                                  className="h-7 px-2 flex items-center gap-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-[11px] font-bold transition-all cursor-pointer"
                                  title="Print Kitchen Order Ticket (KOT)"
                                >
                                  <Printer size={12} />
                                  <span>KOT</span>
                                </button>
                                <button
                                  onClick={() => handleOpenDetails(order)}
                                  className="h-7 px-2 flex items-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[11px] font-semibold transition-all cursor-pointer"
                                  title="View Details"
                                >
                                  <Eye size={11} />
                                  <span>View</span>
                                </button>
                              </>
                            )}

                            {order.status === 'CANCELLED' && (
                              <>
                                <button
                                  onClick={() => handleOpenDetails(order)}
                                  className="h-7 px-2.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <Eye size={12} />
                                  <span>Details</span>
                                </button>
                                <button
                                  onClick={() => handlePrintKOTAction(order)}
                                  className="h-7 px-2 flex items-center gap-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-[11px] font-bold transition-all cursor-pointer"
                                  title="Print KOT"
                                >
                                  <Printer size={12} />
                                  <span>KOT</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* GRID VIEW: HIGH-DENSITY COMPACT POS TILES (~185px TALL, 4-6 COLS)        */
          /* ========================================================================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {filteredOrders.map((order, index) => {
              const totalRounded = Math.round(Number(order.finalDiscountedAmount ?? 0));
              const itemsCount = Array.isArray(order.items) ? order.items.reduce((s: number, i: any) => s + (Number(i.quantity) || 1), 0) : 0;
              const itemsSummary = Array.isArray(order.items) ? order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ') : '-';
              const isPending = order.status === 'PENDING';

              return (
                <motion.div
                  key={order.id || `order-${index}`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className={`flex flex-col justify-between bg-[#12141a]/95 border rounded-xl p-3 hover:border-primary/50 transition-all shadow-md relative overflow-hidden group ${
                    isPending 
                      ? 'border-primary/30 shadow-[0_4px_16px_rgba(0,0,0,0.4)]' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* CARD TOP: TABLE BADGE + ORDER ID & TIME */}
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <div>
                        {renderTableBadge(order.tableNumber, order.status, true)}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="font-mono font-bold text-slate-300">#{order.id}</span>
                        <span className="text-slate-600">&bull;</span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {formatElapsedTime(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* ITEMS PREVIEW & WAITER CHIP */}
                    <div className="bg-black/40 border border-white/5 rounded-lg p-2 mb-2 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 truncate max-w-[120px]">
                          Waiter: <strong className="text-slate-200">{order.user?.name || '-'}</strong>
                        </span>
                        <span className="text-slate-400 font-semibold bg-white/5 px-1.5 py-0.2 rounded text-[10px]">
                          {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 truncate font-sans" title={itemsSummary}>
                        {itemsSummary}
                      </div>
                    </div>

                    {/* FINANCIALS SUMMARY (SINGLE SLEEK LINE) */}
                    <div className="flex items-baseline justify-between mb-2">
                      <div className="text-[10px] text-slate-400 font-mono">
                        Base ₹{order.baseAmount ?? 0} &bull; GST ₹{order.gstAmount ?? 0}
                        {Number(order.discountAmount) > 0 && (
                          <span className="text-emerald-400 font-bold ml-1">-₹{order.discountAmount}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black font-mono text-emerald-400 tracking-tight">
                          ₹{totalRounded}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION FOOTER */}
                  <div className="pt-2 border-t border-white/5 space-y-1.5">
                    {order.status === 'PENDING' && (
                      <>
                        {/* Primary Quick Row: Mark Done & Print KOT */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => setOrderToComplete(order)}
                            className="h-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                            title="Complete and Settle Order"
                          >
                            <CheckCircle size={13} />
                            <span>Mark Done</span>
                          </button>

                          <button
                            onClick={() => handlePrintKOTAction(order)}
                            className="h-8 flex items-center justify-center gap-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95"
                            title="Print Kitchen Order Ticket (KOT)"
                          >
                            <Printer size={13} />
                            <span>Print KOT</span>
                          </button>
                        </div>

                        {/* Secondary Row: Labeled Edit, Disc, View, Cancel */}
                        <div className="grid grid-cols-4 gap-1">
                          <button
                            onClick={() => handleOpenEdit(order)}
                            className="h-7 flex items-center justify-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[10.5px] font-semibold transition-all cursor-pointer active:scale-95"
                            title="Edit Order Items"
                          >
                            <Edit2 size={11} className="text-slate-400 shrink-0" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => setOrderToDiscount(order)}
                            className="h-7 flex items-center justify-center gap-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[10.5px] font-semibold transition-all cursor-pointer active:scale-95"
                            title="Apply Discount"
                          >
                            <Tag size={11} className="text-amber-400 shrink-0" />
                            <span>Disc</span>
                          </button>

                          <button
                            onClick={() => handleOpenDetails(order)}
                            className="h-7 flex items-center justify-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[10.5px] font-semibold transition-all cursor-pointer active:scale-95"
                            title="View Full Details"
                          >
                            <Eye size={11} className="text-slate-400 shrink-0" />
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => setOrderToCancel(order.id)}
                            className="h-7 flex items-center justify-center gap-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10.5px] font-semibold transition-all cursor-pointer active:scale-95"
                            title="Cancel Order"
                          >
                            <X size={12} className="shrink-0" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </>
                    )}

                    {order.status === 'COMPLETED' && (
                      <>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => printReceipt(order)}
                            className="h-8 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            title="Print Customer Bill Receipt"
                          >
                            <Printer size={13} />
                            <span>Print Bill</span>
                          </button>

                          <button
                            onClick={() => handlePrintKOTAction(order)}
                            className="h-8 flex items-center justify-center gap-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all cursor-pointer"
                            title="Print Kitchen Order Ticket (KOT)"
                          >
                            <Printer size={13} />
                            <span>Print KOT</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleOpenDetails(order)}
                          className="w-full h-7 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold transition-all cursor-pointer"
                          title="View Full Details"
                        >
                          <Eye size={12} className="text-slate-400" />
                          <span>View Full Details</span>
                        </button>
                      </>
                    )}

                    {order.status === 'CANCELLED' && (
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => handleOpenDetails(order)}
                          className="h-7.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye size={12} className="text-slate-400" />
                          <span>View Details</span>
                        </button>
                        <button
                          onClick={() => handlePrintKOTAction(order)}
                          className="h-7.5 flex items-center justify-center gap-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all cursor-pointer"
                          title="Print KOT"
                        >
                          <Printer size={12} />
                          <span>Print KOT</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. COMPACT PAGINATION FOOTER */}
      {/* ========================================================================= */}
      {meta && (meta.totalPages > 1 || meta.total > 10) && (
        <div className="flex flex-wrap justify-between items-center gap-3 bg-black/40 px-3 py-2 rounded-xl border border-white/10 shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Page <strong className="text-white">{meta.page}</strong> of <strong className="text-white">{meta.totalPages || 1}</strong>
            </span>
            <span className="text-slate-600">&bull;</span>
            <span><strong className="text-white">{meta.total}</strong> total orders</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Page size selector */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span>Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-white font-mono outline-none"
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex gap-1.5">
              <button
                disabled={meta.page <= 1}
                onClick={() => {
                  const newPage = meta.page - 1;
                  setCurrentPage(newPage);
                  fetchOrdersData(newPage);
                }}
                className="px-2.5 py-1 bg-surface border border-white/10 rounded-lg text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 transition-colors font-semibold"
              >
                Prev
              </button>
              <button
                disabled={meta.page >= meta.totalPages}
                onClick={() => {
                  const newPage = meta.page + 1;
                  setCurrentPage(newPage);
                  fetchOrdersData(newPage);
                }}
                className="px-2.5 py-1 bg-surface border border-white/10 rounded-lg text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 transition-colors font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODALS (CREATE/EDIT, DETAILS, CANCEL, RECEIPT, DISCOUNT, KOT)           */}
      {/* ========================================================================= */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSuccess={() => fetchOrdersData(currentPage)}
        orderToEdit={selectedOrder}
      />

      {selectedOrder && (
        <OrderDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          orderId={selectedOrder.id}
        />
      )}

      <CancelOrderModal
        isOpen={orderToCancel !== null}
        onClose={() => setOrderToCancel(null)}
        orderId={orderToCancel}
        onSuccess={() => fetchOrdersData(currentPage)}
      />

      <ReceiptModal
        isOpen={orderToComplete !== null}
        onClose={() => setOrderToComplete(null)}
        order={orderToComplete}
        onConfirm={handleCompleteOrder}
      />

      <DiscountModal
        isOpen={orderToDiscount !== null}
        onClose={() => setOrderToDiscount(null)}
        order={orderToDiscount}
        onConfirm={async (amounts) => {
          if (!orderToDiscount) return;
          await dispatch(updateOrder({
            id: orderToDiscount.id,
            data: amounts
          })).unwrap();
          fetchOrdersData(currentPage);
        }}
      />

      <ConfirmPrintModal
        isOpen={confirmKotModal.isOpen}
        onConfirm={handleConfirmKotResult}
      />
    </div>
  );
}
