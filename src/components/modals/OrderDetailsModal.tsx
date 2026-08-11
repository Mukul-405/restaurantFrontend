import React, { useEffect,useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Phone, Calendar, IndianRupee, User, Hash, Printer } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchOrderById, updateOrder, transferOrderToRoom } from '../../store/slices/orderSlice';
import CancelOrderModal from './CancelOrderModal';
import TransferToRoomModal from './TransferToRoomModal';
import { printReceipt } from '../../utils/printReceipt';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
}

export default function OrderDetailsModal({ isOpen, onClose, orderId }: OrderDetailsModalProps) {
  const dispatch = useAppDispatch();
  const { selectedOrder, status, error } = useAppSelector(state => state.order);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      dispatch(fetchOrderById(orderId));
    }
  }, [isOpen, orderId, dispatch]);

  const handleStatusChange = async (newStatus: string) => {
    if (selectedOrder) {
      setIsUpdatingStatus(true);
      try {
        const payload: any = { status: newStatus };
        if (newStatus === 'COMPLETED' && !selectedOrder.paymentMode) {
          payload.paymentMode = 'CASH';
        }
        await dispatch(updateOrder({ id: selectedOrder.id, data: payload }));
      } finally {
        setIsUpdatingStatus(false);
      }
    }
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
                  <button
                    onClick={() => printReceipt(selectedOrder)}
                    className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors px-3 py-2 rounded-lg text-sm font-bold"
                  >
                    <Printer size={16} />
                    <span className="hidden sm:inline">Print Bill</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-white/5"
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 text-slate-400 mb-1 text-sm font-medium">
                          <Phone size={14} /> Phone Number
                        </div>
                        <div className="text-slate-200 font-bold">{selectedOrder.phoneNumber}</div>
                      </div>
                      <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 text-slate-400 mb-1 text-sm font-medium">
                          <Hash size={14} /> Table
                        </div>
                        <div className="text-slate-200 font-bold">{selectedOrder.tableNumber || '-'}</div>
                      </div>
                      <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 text-slate-400 mb-1 text-sm font-medium">
                          <Calendar size={14} /> Date & Time
                        </div>
                        <div className="text-slate-200 font-bold">
                          {new Date(selectedOrder.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-black/20 p-4 rounded-xl border border-white/5 sm:col-span-3 flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2 text-slate-400 mb-1 text-sm font-medium">
                            <User size={14} /> Waiter
                          </div>
                          <div className="text-slate-200 font-bold">
                            {selectedOrder.user ? selectedOrder.user.name : 'Unknown'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-400 text-sm mb-1 font-medium">Status</div>
                          <div className="font-black tracking-wider text-sm">
                            {selectedOrder.status === 'PENDING' && <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full">PENDING</span>}
                            {selectedOrder.status === 'COMPLETED' && <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">COMPLETED</span>}
                            {selectedOrder.status === 'CANCELLED' && <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full">CANCELLED</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons if Pending */}
                    {selectedOrder.status === 'PENDING' && (
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          onClick={() => setIsCancelModalOpen(true)}
                          className="flex-1 py-3 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl font-bold transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => setIsTransferModalOpen(true)}
                          className="flex-1 py-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 rounded-xl font-bold transition-all"
                        >
                          Transfer to Room
                        </button>
                        <button
                          onClick={() => handleStatusChange('COMPLETED')}
                          disabled={isUpdatingStatus}
                          className="flex-1 py-3 bg-emerald-600 border border-emerald-500/20 text-white hover:bg-emerald-700 rounded-xl font-bold transition-all shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isUpdatingStatus && <Loader2 className="animate-spin" size={16} />}
                          Mark Completed
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
                            <div>
                              <h4 className="text-slate-200 font-medium text-base mb-1">{item.name}</h4>
                              <div className="text-slate-400 text-sm">₹{item.price} <span className="text-slate-500 mx-1">x</span> <span className="font-bold text-slate-300">{item.quantity}</span></div>
                            </div>
                            <div className="text-emerald-400 font-bold text-lg tracking-wide">
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
                      <div className="text-center">
                        <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Total</div>
                        <div className="text-emerald-400 font-black text-xl">₹{selectedOrder.finalDiscountedAmount ?? 0}</div>
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
          }}
        />
      )}
    </>
  );
}
