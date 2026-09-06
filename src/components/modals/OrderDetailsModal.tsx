import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Calendar, IndianRupee, User, Hash, Printer, Tag, Banknote, CreditCard, Smartphone, Building, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchOrderById, updateOrder, transferOrderToRoom } from '../../store/slices/orderSlice';
import CancelOrderModal from './CancelOrderModal';
import TransferToRoomModal from './TransferToRoomModal';
import DiscountModal from './DiscountModal';
import ReceiptModal from './ReceiptModal';
import { ConfirmPrintModal } from './ConfirmPrintModal';
import { printReceipt, printKOT } from '../../utils/printReceipt';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  onOrderUpdated?: () => void;
}

export default function OrderDetailsModal({ isOpen, onClose, orderId, onOrderUpdated }: OrderDetailsModalProps) {
  const dispatch = useAppDispatch();
  const { selectedOrder, status, error } = useAppSelector(state => state.order);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [confirmKotModal, setConfirmKotModal] = useState<{ isOpen: boolean; orderId: number | null }>({ isOpen: false, orderId: null });

  useEffect(() => {
    if (isOpen && orderId) {
      dispatch(fetchOrderById(orderId));
    }
  }, [isOpen, orderId, dispatch]);

  const handlePrintKOTAction = (order: any) => {
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
        dispatch(fetchOrderById(confirmKotModal.orderId));
      } catch (err) {
        console.error('Failed to clear KOT status', err);
      }
    }
    setConfirmKotModal({ isOpen: false, orderId: null });
  };

  const handleStatusChange = async (newStatus: string) => {
    if (selectedOrder) {
      setIsUpdatingStatus(true);
      try {
        const payload: any = { status: newStatus };
        if (newStatus === 'COMPLETED' && !selectedOrder.paymentMode) {
          payload.paymentMode = 'CASH';
        }
        await dispatch(updateOrder({ id: selectedOrder.id, data: payload }));
        dispatch(fetchOrderById(selectedOrder.id));
        onOrderUpdated?.();
      } finally {
        setIsUpdatingStatus(false);
      }
    }
  };

  const handleCompleteFromReceipt = async (amounts: {
    baseAmount: number;
    gstAmount: number;
    discountAmount: number;
    finalDiscountedAmount: number;
    paymentMode: 'CASH' | 'CARD' | 'UPI';
  }) => {
    if (!selectedOrder) return;
    try {
      await dispatch(updateOrder({
        id: selectedOrder.id,
        data: { status: 'COMPLETED', ...amounts }
      })).unwrap();
      dispatch(fetchOrderById(selectedOrder.id));
      setIsReceiptModalOpen(false);
      onOrderUpdated?.();
      toast.success(`Order #${selectedOrder.id} completed via ${amounts.paymentMode}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete order');
    }
  };

  const handlePaymentModeChange = async (newMode: 'CASH' | 'CARD' | 'UPI') => {
    if (!selectedOrder) return;
    setIsUpdatingStatus(true);
    try {
      await dispatch(updateOrder({ id: selectedOrder.id, data: { paymentMode: newMode } })).unwrap();
      dispatch(fetchOrderById(selectedOrder.id));
      onOrderUpdated?.();
      toast.success(`Payment mode updated to ${newMode}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update payment mode');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const renderPaymentBadge = (mode?: string | null) => {
    const m = (mode || 'CASH').toUpperCase();
    if (m === 'UPI') {
      return (
        <span className="inline-flex items-center gap-1 font-bold rounded-lg uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/40 px-2.5 py-0.5 text-xs shadow-sm">
          <Smartphone size={12} className="text-violet-400 shrink-0" />
          <span>UPI</span>
        </span>
      );
    }
    if (m === 'CARD') {
      return (
        <span className="inline-flex items-center gap-1 font-bold rounded-lg uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2.5 py-0.5 text-xs shadow-sm">
          <CreditCard size={12} className="text-sky-400 shrink-0" />
          <span>Card</span>
        </span>
      );
    }
    if (m === 'ROOM_TRANSFER') {
      return (
        <span className="inline-flex items-center gap-1 font-bold rounded-lg uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 text-xs shadow-sm">
          <Building size={12} className="text-amber-400 shrink-0" />
          <span>Room Trf</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 font-bold rounded-lg uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 text-xs shadow-sm">
        <Banknote size={12} className="text-emerald-400 shrink-0" />
        <span>Cash</span>
      </span>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div key="order-details-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-surface border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-white/10 bg-surface/80 backdrop-blur-md sticky top-0 z-20">
              <h2 className="text-xl font-bold text-slate-100">Order Details #{orderId}</h2>
              <div className="flex items-center gap-2">
                {selectedOrder && (
                  <>
                    <button
                      onClick={() => handlePrintKOTAction(selectedOrder)}
                      className="flex items-center gap-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors px-3 py-2 rounded-lg text-sm font-bold cursor-pointer"
                      title="Print KOT"
                    >
                      <Printer size={16} />
                      <span className="hidden sm:inline">Print KOT</span>
                    </button>
                    <button
                      onClick={() => printReceipt(selectedOrder)}
                      className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors px-3 py-2 rounded-lg text-sm font-bold cursor-pointer"
                      title="Print Bill"
                    >
                      <Printer size={16} />
                      <span className="hidden sm:inline">Print Bill</span>
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
              <div className="p-4 md:p-6 flex-1">
                {status === 'loading' || !selectedOrder || selectedOrder.id !== orderId ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="animate-spin text-primary" size={32} />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Header Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 rounded-xl border border-primary/40 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 relative overflow-hidden transition-all shadow-[0_0_18px_-3px_rgba(139,92,246,0.3)]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm font-semibold text-purple-200">
                            <Hash size={14} className="text-primary-light" /> Table
                          </div>
                          {selectedOrder.status === 'PENDING' && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-light opacity-80"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                          )}
                        </div>
                        <div className="inline-block font-black text-xl font-mono tracking-wide bg-primary text-white px-3.5 py-1 rounded-lg border border-primary-light/40 shadow-[0_4px_14px_0_rgba(139,92,246,0.45)]">
                          {selectedOrder.tableNumber ? (String(selectedOrder.tableNumber).toLowerCase().startsWith('table') ? selectedOrder.tableNumber : `Table ${selectedOrder.tableNumber}`) : '-'}
                        </div>
                      </div>
                      <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 text-slate-400 mb-1 text-sm font-medium">
                          <Calendar size={14} /> Date & Time
                        </div>
                        <div className="text-slate-200 font-bold">
                          {new Date(selectedOrder.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-black/20 p-4 rounded-xl border border-white/5 sm:col-span-2 flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2 text-slate-400 mb-1 text-sm font-medium">
                            <User size={14} /> Waiter
                          </div>
                          <div className="text-slate-200 font-bold">
                            {selectedOrder.user ? selectedOrder.user.name : 'Unknown'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-400 text-sm mb-1 font-medium">Status & Payment</div>
                          <div className="font-black tracking-wider text-sm flex items-center gap-2 justify-end flex-wrap">
                            {selectedOrder.status === 'PENDING' && <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full">PENDING</span>}
                            {selectedOrder.status === 'COMPLETED' && (
                              <>
                                <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">COMPLETED</span>
                                {renderPaymentBadge(selectedOrder.paymentMode)}
                              </>
                            )}
                            {selectedOrder.status === 'CANCELLED' && <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full">CANCELLED</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Payment Mode Switcher for Completed Order */}
                    {selectedOrder.status === 'COMPLETED' && (
                      <div className="bg-black/30 border border-white/10 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Payment Mode:</span>
                          {renderPaymentBadge(selectedOrder.paymentMode)}
                        </div>
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <span className="text-[11px] text-slate-400 mr-1 font-medium">Switch Mode:</span>
                          {(['CASH', 'UPI', 'CARD'] as const).map((mode) => {
                            const currentMode = (selectedOrder.paymentMode || 'CASH').toUpperCase();
                            const isCurrent = currentMode === mode;
                            return (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => handlePaymentModeChange(mode)}
                                disabled={isUpdatingStatus || isCurrent}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isCurrent
                                    ? 'bg-primary text-white shadow-sm ring-1 ring-white/20'
                                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                                } disabled:opacity-50`}
                                title={`Switch payment mode to ${mode}`}
                              >
                                {mode}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons if Pending */}
                    {selectedOrder.status === 'PENDING' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <button
                          onClick={() => setIsCancelModalOpen(true)}
                          className="py-2.5 px-3 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl font-bold text-sm transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => setIsDiscountModalOpen(true)}
                          className="py-2.5 px-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Tag size={15} />
                          <span>Discount</span>
                        </button>
                        <button
                          onClick={() => setIsTransferModalOpen(true)}
                          className="py-2.5 px-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 rounded-xl font-bold text-sm transition-all cursor-pointer"
                        >
                          Transfer Room
                        </button>
                        <button
                          onClick={() => setIsReceiptModalOpen(true)}
                          disabled={isUpdatingStatus}
                          className="py-2.5 px-3 bg-emerald-600 border border-emerald-500/20 text-white hover:bg-emerald-700 rounded-xl font-bold text-sm transition-all shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Complete Order & Choose Payment Mode"
                        >
                          <CheckCircle size={15} />
                          <span>Mark Done</span>
                        </button>
                      </div>
                    )}

                    {selectedOrder.cancellationReason && (
                      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400">
                        <div className="font-semibold text-sm mb-1">Cancellation Reason:</div>
                        {selectedOrder.cancellationReason}
                      </div>
                    )}

                    {/* Order Items */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-200 mb-3">Ordered Items</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedOrder.items?.map((item, index) => (
                          <div key={`item-${index}`} className="bg-[#24262b] border border-white/5 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                            <div className="flex-1 min-w-0 pr-3">
                              <h4 className="text-slate-200 font-medium text-base mb-1 leading-snug break-words" title={item.name}>{item.name}</h4>
                              <div className="text-slate-400 text-sm">₹{item.price} <span className="text-slate-500 mx-1">x</span> <span className="font-bold text-slate-300">{item.quantity}</span></div>
                            </div>
                            <div className="text-emerald-400 font-bold text-lg tracking-wide shrink-0">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Footer for Totals */}
              {!status.includes('loading') && selectedOrder && (
                <div className="sticky bottom-0 bg-[#1c1e23] border-t border-white/10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] z-20">
                  <div className="p-4 md:p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center px-2">
                      <div className="text-center">
                        <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Base</div>
                        <div className="text-slate-300 font-bold text-base">₹{selectedOrder.baseAmount ?? 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">GST (5%)</div>
                        <div className="text-slate-300 font-bold text-base">₹{selectedOrder.gstAmount ?? 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Disc</div>
                        <div className="text-emerald-400 font-bold text-base">-₹{selectedOrder.discountAmount ?? 0}</div>
                      </div>
                      {(() => {
                        const raw = Number(selectedOrder.baseAmount || 0) + Number(selectedOrder.gstAmount || 0) - Number(selectedOrder.discountAmount || 0);
                        const rounded = Math.round(Number(selectedOrder.finalDiscountedAmount ?? raw));
                        const roundOff = Number((rounded - raw).toFixed(2));
                        return (
                          <div className="text-center">
                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Round Off</div>
                            <div className={`font-bold text-base ${roundOff !== 0 ? "text-amber-400 font-mono" : "text-slate-300 font-mono"}`}>
                              {roundOff > 0 ? `+₹${roundOff.toFixed(2)}` : roundOff < 0 ? `-₹${Math.abs(roundOff).toFixed(2)}` : '₹0.00'}
                            </div>
                          </div>
                        );
                      })()}
                      <div className="text-center">
                        <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Total</div>
                        <div className="text-emerald-400 font-black text-xl">₹{Math.round(Number(selectedOrder.finalDiscountedAmount ?? 0))}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      <CancelOrderModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        orderId={selectedOrder?.id || null}
        onSuccess={() => {
          if (selectedOrder) {
            dispatch(fetchOrderById(selectedOrder.id));
          }
          onOrderUpdated?.();
          setIsCancelModalOpen(false);
        }}
      />

      {selectedOrder && (
        <TransferToRoomModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          orderId={selectedOrder.id}
          onSubmit={async (data) => {
            await dispatch(transferOrderToRoom({ id: selectedOrder.id, data })).unwrap();
            dispatch(fetchOrderById(selectedOrder.id));
            onOrderUpdated?.();
          }}
        />
      )}

      {selectedOrder && (
        <DiscountModal
          isOpen={isDiscountModalOpen}
          onClose={() => setIsDiscountModalOpen(false)}
          order={selectedOrder}
          onConfirm={async (amounts) => {
            await dispatch(updateOrder({ id: selectedOrder.id, data: amounts })).unwrap();
            dispatch(fetchOrderById(selectedOrder.id));
            onOrderUpdated?.();
          }}
        />
      )}

      {selectedOrder && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          order={selectedOrder}
          onConfirm={handleCompleteFromReceipt}
        />
      )}

      <ConfirmPrintModal
        isOpen={confirmKotModal.isOpen}
        onConfirm={handleConfirmKotResult}
      />
    </>
  );
}
