'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw, Plus, Search, Eye, Edit2, ChevronDown, ChevronUp, X, CheckCircle, Filter, Printer, Tag } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchOrders, Order, updateOrder } from '../../../store/slices/orderSlice';
import { fetcher } from '../../../lib/fetcher';
import OrderModal from '../../../components/modals/OrderModal';
import OrderDetailsModal from '../../../components/modals/OrderDetailsModal';
import CancelOrderModal from '../../../components/modals/CancelOrderModal';
import ReceiptModal from '../../../components/modals/ReceiptModal';
import DiscountModal from '../../../components/modals/DiscountModal';
import { printReceipt } from '../../../utils/printReceipt';
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
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Default to PENDING as requested by user
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'COMPLETED' | 'CANCELLED' | 'ALL'>('PENDING');

  const [waiterFilter, setWaiterFilter] = useState<string>('ALL');
  const [waiters, setWaiters] = useState<{id: string; name: string}[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState<number | string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const toggleAccordion = (id: number | string) => {
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  useEffect(() => {
    fetcher.getUsers().then(data => setWaiters(data)).catch(console.error);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchOrdersData(1);
  }, [dispatch, statusFilter, waiterFilter]);

  const fetchOrdersData = (page = currentPage) => {
    const params: any = {};
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (waiterFilter !== 'ALL') params.userId = waiterFilter;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    params.page = page;
    params.limit = 10;
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

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setWaiterFilter('ALL');
    setStatusFilter('PENDING');
    setCurrentPage(1);
    
    // Explicitly fetch to reflect reset immediately
    dispatch(fetchOrders({ status: 'PENDING', page: 1, limit: 10 }));
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    await dispatch(updateOrder({ id, data: { status: newStatus } })).unwrap();
    fetchOrdersData(currentPage);
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

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold tracking-wider">PENDING</span>;
      case 'COMPLETED':
        return <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold tracking-wider">COMPLETED</span>;
      case 'CANCELLED':
        return <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold tracking-wider">CANCELLED</span>;
      default:
        return <span className="bg-slate-500/20 text-slate-400 px-3 py-1 rounded-full text-xs font-bold tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            Orders
            {status === 'loading' && <Loader2 className="animate-spin text-primary" size={20} />}
          </h1>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border-none outline-none bg-primary text-white shadow-[0_4px_14px_0_var(--color-primary-light)] hover:bg-primary-hover hover:-translate-y-[1px]"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">New Order</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex bg-surface/50 p-1 rounded-xl border border-white/10 w-full lg:w-auto overflow-x-auto">
          {['PENDING', 'COMPLETED', 'CANCELLED', 'ALL'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === tab 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        
        <div className="flex w-full lg:w-auto gap-2">
          <select
            value={waiterFilter}
            onChange={(e) => setWaiterFilter(e.target.value)}
            className="bg-surface/50 border border-white/10 text-slate-200 px-4 py-2 rounded-xl font-sans text-sm outline-none focus:border-primary flex-1 lg:flex-none"
          >
            <option value="ALL">All Waiters</option>
            {waiters.map((waiter, index) => (
              <option key={waiter.id || `waiter-${index}`} value={waiter.id}>{waiter.name}</option>
            ))}
          </select>
          <button 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`md:hidden px-4 py-2 border rounded-xl flex items-center justify-center gap-2 transition-colors ${showMobileFilters ? 'bg-primary border-primary text-white' : 'bg-surface/50 border-white/10 text-slate-200 hover:bg-white/5'}`}
          >
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      <div className={`bg-black/20 border border-white/10 rounded-xl p-4 flex-col md:flex-row gap-4 items-end ${showMobileFilters ? 'flex' : 'hidden md:flex'}`}>
        <div className="flex w-full md:flex-1 gap-3">
          <div className="flex-1 w-full">
            <label className="block text-sm text-slate-400 mb-1">Start Date</label>
            <input 
              type="date" 
              className="w-full bg-surface/50 border border-white/10 text-slate-200 px-3 py-2 rounded-lg font-sans text-sm outline-none focus:border-primary cursor-pointer"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onKeyDown={(e) => e.preventDefault()}
              onClick={(e) => e.currentTarget.showPicker && e.currentTarget.showPicker()}
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm text-slate-400 mb-1">End Date</label>
            <input 
              type="date" 
              className="w-full bg-surface/50 border border-white/10 text-slate-200 px-3 py-2 rounded-lg font-sans text-sm outline-none focus:border-primary cursor-pointer"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              onKeyDown={(e) => e.preventDefault()}
              onClick={(e) => e.currentTarget.showPicker && e.currentTarget.showPicker()}
            />
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={() => { setCurrentPage(1); fetchOrdersData(1); }}
            className="flex-1 md:flex-none px-6 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary-hover transition-colors h-[38px]"
          >
            Apply
          </button>
          <button
            onClick={handleResetFilters}
            className="flex-1 md:flex-none px-6 py-2 bg-white/10 text-slate-300 rounded-lg font-semibold text-sm hover:bg-white/20 transition-colors h-[38px]"
          >
            Reset
          </button>
        </div>
      </div>


      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
        {status === 'loading' ? (
          <div className="bg-surface/50 border border-white/10 rounded-2xl p-16 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
            <Loader2 className="animate-spin text-primary mb-3" size={36} />
            <p className="text-sm font-medium">Loading orders...</p>
          </div>
        ) : status === 'failed' ? (
          <div className="bg-surface/50 border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
            <p className="text-danger mb-4">{error || 'Failed to load orders'}</p>
            <button 
              onClick={() => fetchOrdersData()}
              className="flex items-center gap-2 text-primary hover:text-primary-hover font-semibold"
            >
              <RefreshCw size={16} />
              <span>Retry</span>
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-surface/50 border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
            <p>No orders found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order, index) => (
              <React.Fragment key={order.id || `order-${index}`}>
                {/* ------------------- DESKTOP VIEW ------------------- */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hidden md:flex flex-col bg-surface/30 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors"
                >
                  <div className="space-y-2 mb-5 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Order ID:</span>
                      <span className="text-slate-200 font-mono">#{order.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Status:</span>
                      <span>{renderStatusBadge(order.status)}</span>
                    </div>
                    {order.status === 'COMPLETED' && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Payment Mode:</span>
                        <span className="text-slate-200 font-bold">{order.paymentMode || '-'}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Table:</span>
                      <span className="text-slate-200 font-bold">{order.tableNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Waiter:</span>
                      <span className="text-slate-200">{order.user?.name || '-'}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Base:</span>
                      <span className="text-slate-200">₹{order.baseAmount ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">GST (5%):</span>
                      <span className="text-slate-200">₹{order.gstAmount ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Discount:</span>
                      <span className={Number(order.discountAmount) > 0 ? "text-emerald-400 font-bold" : "text-slate-200"}>
                        {Number(order.discountAmount) > 0 ? `-₹${order.discountAmount}` : '₹0'}
                      </span>
                    </div>
                    {(() => {
                      const raw = Number(order.baseAmount || 0) + Number(order.gstAmount || 0) - Number(order.discountAmount || 0);
                      const rounded = Math.round(Number(order.finalDiscountedAmount ?? raw));
                      const roundOff = Number((rounded - raw).toFixed(2));
                      return (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Round Off:</span>
                          <span className={roundOff !== 0 ? "text-amber-400 font-medium font-mono" : "text-slate-400 font-mono"}>
                            {roundOff > 0 ? `+₹${roundOff.toFixed(2)}` : roundOff < 0 ? `-₹${Math.abs(roundOff).toFixed(2)}` : '₹0.00'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex justify-between items-center mb-5 mt-auto">
                    <span className="text-slate-200 font-bold tracking-wider">TOTAL:</span>
                    <span className="text-2xl font-bold text-emerald-400">₹{Math.round(Number(order.finalDiscountedAmount ?? 0))}</span>
                  </div>

                  <div className="flex flex-col gap-2 pt-3 border-t border-white/5 mt-2">
                    {order.status === 'PENDING' && (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => handleOpenEdit(order)}
                            className="h-9 px-2.5 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-white/5 active:scale-[0.98]"
                          >
                            <Edit2 size={13} className="text-slate-400" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setOrderToDiscount(order)}
                            className="h-9 px-2.5 text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                          >
                            <Tag size={13} />
                            <span>Discount</span>
                          </button>
                          <button
                            onClick={() => handleOpenDetails(order)}
                            className="h-9 px-2.5 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-white/5 active:scale-[0.98]"
                          >
                            <Eye size={13} className="text-slate-400" />
                            <span>View</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setOrderToCancel(order.id)}
                            className="h-9 px-3 text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all flex items-center justify-center gap-1 active:scale-[0.98]"
                          >
                            <X size={13} />
                            <span>Cancel</span>
                          </button>
                          <button
                            onClick={() => setOrderToComplete(order)}
                            className="col-span-2 h-9 px-3 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 active:scale-[0.98]"
                          >
                            <CheckCircle size={14} />
                            <span>Mark Done</span>
                          </button>
                        </div>
                      </>
                    )}

                    {order.status === 'COMPLETED' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleOpenDetails(order)}
                          className="h-9 px-3 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-white/5"
                        >
                          <Eye size={14} className="text-slate-400" />
                          <span>View Details</span>
                        </button>
                        <button
                          onClick={() => printReceipt(order)}
                          className="h-9 px-3 text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all flex items-center justify-center gap-1.5"
                          title="Print Bill"
                        >
                          <Printer size={14} />
                          <span>Print Bill</span>
                        </button>
                      </div>
                    )}

                    {order.status === 'CANCELLED' && (
                      <button
                        onClick={() => handleOpenDetails(order)}
                        className="w-full h-9 px-3 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-white/5"
                      >
                        <Eye size={14} className="text-slate-400" />
                        <span>View Details</span>
                      </button>
                    )}
                  </div>
                </motion.div>

                {/* ------------------- MOBILE VIEW (ACCORDION) ------------------- */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="md:hidden flex flex-col border border-primary/30 rounded-xl overflow-hidden bg-black/40"
                >
                  <div 
                    onClick={() => toggleAccordion(order.id)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-200 font-medium">Order ID <span className="font-mono">#{order.id}</span></span>
                      {renderStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-200 font-semibold tracking-wide">₹{Math.round(Number(order.finalDiscountedAmount ?? 0))}</span>
                      {expandedOrderId === order.id ? (
                        <ChevronUp size={18} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={18} className="text-slate-400" />
                      )}
                    </div>
                  </div>

                  {expandedOrderId === order.id && (
                    <div className="px-4 pb-4">
                      <div className="bg-surface/50 border border-white/5 rounded-xl p-4">
                        <div className="space-y-2 text-sm mb-4">
                          <div className="text-slate-400">PAYMENT MODE: <span className="text-slate-200">{order.paymentMode || '-'}</span></div>
                          <div className="text-slate-400">TABLE: <span className="text-slate-200 font-bold">{order.tableNumber || '-'}</span></div>
                          <div className="text-slate-400">WAITER: <span className="text-slate-200">{order.user?.name || '-'}</span></div>
                          <div className="text-slate-400">DATE & TIME: <span className="text-slate-200">{new Date(order.createdAt).toLocaleString()}</span></div>
                        </div>
                        
                        <div className="border-t border-white/5 pt-4 space-y-1.5 text-sm mb-5">
                          <div className="text-slate-400">Base: <span className="text-slate-200">₹{order.baseAmount ?? 0}</span></div>
                          <div className="text-slate-400">GST: <span className="text-slate-200">₹{order.gstAmount ?? 0}</span></div>
                          <div className="text-slate-400">
                            Disc: <span className={Number(order.discountAmount) > 0 ? "text-emerald-400 font-bold" : "text-slate-200"}>
                              {Number(order.discountAmount) > 0 ? `-₹${order.discountAmount}` : '₹0'}
                            </span>
                          </div>
                          {(() => {
                            const raw = Number(order.baseAmount || 0) + Number(order.gstAmount || 0) - Number(order.discountAmount || 0);
                            const rounded = Math.round(Number(order.finalDiscountedAmount ?? raw));
                            const roundOff = Number((rounded - raw).toFixed(2));
                            return (
                              <div className="text-slate-400">
                                Round Off: <span className={roundOff !== 0 ? "text-amber-400 font-medium font-mono" : "text-slate-400 font-mono"}>
                                  {roundOff > 0 ? `+₹${roundOff.toFixed(2)}` : roundOff < 0 ? `-₹${Math.abs(roundOff).toFixed(2)}` : '₹0.00'}
                                </span>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="flex flex-col gap-2">
                          {order.status === 'PENDING' && (
                            <>
                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpenEdit(order); }}
                                  className="h-9 px-2 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-white/5"
                                >
                                  <Edit2 size={13} className="text-slate-400" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setOrderToDiscount(order); }}
                                  className="h-9 px-2 text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl transition-all flex items-center justify-center gap-1.5"
                                >
                                  <Tag size={13} />
                                  <span>Discount</span>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpenDetails(order); }}
                                  className="h-9 px-2 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-white/5"
                                >
                                  <Eye size={13} className="text-slate-400" />
                                  <span>View</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setOrderToCancel(order.id); }}
                                  className="h-9 px-3 text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all flex items-center justify-center gap-1"
                                >
                                  <X size={13} />
                                  <span>Cancel</span>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setOrderToComplete(order); }}
                                  className="col-span-2 h-9 px-3 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                                >
                                  <CheckCircle size={14} />
                                  <span>Mark Done</span>
                                </button>
                              </div>
                            </>
                          )}

                          {order.status === 'COMPLETED' && (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenDetails(order); }}
                                className="h-9 px-3 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-white/5"
                              >
                                <Eye size={14} className="text-slate-400" />
                                <span>View Details</span>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); printReceipt(order); }}
                                className="h-9 px-3 text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all flex items-center justify-center gap-1.5"
                              >
                                <Printer size={14} />
                                <span>Print Bill</span>
                              </button>
                            </div>
                          )}

                          {order.status === 'CANCELLED' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenDetails(order); }}
                              className="w-full h-9 px-3 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-white/5"
                            >
                              <Eye size={14} className="text-slate-400" />
                              <span>View Details</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/10 shrink-0">
          <span className="text-sm text-slate-400">
            Showing page <span className="font-semibold text-slate-200">{meta.page}</span> of <span className="font-semibold text-slate-200">{meta.totalPages}</span> ({meta.total} total orders)
          </span>
          <div className="flex gap-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => {
                const newPage = meta.page - 1;
                setCurrentPage(newPage);
                fetchOrdersData(newPage);
              }}
              className="px-4 py-2 bg-surface border border-white/10 rounded-lg text-sm text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => {
                const newPage = meta.page + 1;
                setCurrentPage(newPage);
                fetchOrdersData(newPage);
              }}
              className="px-4 py-2 bg-surface border border-white/10 rounded-lg text-sm text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSuccess={fetchOrdersData}
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
    </div>
  );
}
