import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle, Receipt } from 'lucide-react';
import { Order } from '../../store/slices/orderSlice';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onConfirm: (amounts: {
    baseAmount: number;
    gstAmount: number;
    discountAmount: number;
    finalDiscountedAmount: number;
    paymentMode: 'CASH' | 'CARD' | 'UPI';
  }) => Promise<void>;
}

export default function ReceiptModal({ isOpen, onClose, order, onConfirm }: ReceiptModalProps) {
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDiscountType('PERCENTAGE');
      setDiscountValue('');
      setPaymentMode('CASH');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const baseAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gstAmount = baseAmount * 0.05;
  const originalTotal = baseAmount + gstAmount;

  // Parse discount value safely
  const parsedValue = parseFloat(discountValue) || 0;

  // Calculate discount amount against the base amount
  let discountAmount = 0;
  if (discountType === 'PERCENTAGE') {
    // Prevent negative or > 100 percentages
    const clampedPercent = Math.min(Math.max(parsedValue, 0), 100);
    discountAmount = (baseAmount * clampedPercent) / 100;
  } else {
    // Prevent discount > base amount (cannot discount more than the subtotal itself)
    discountAmount = Math.min(Math.max(parsedValue, 0), baseAmount);
  }

  // Final total = Base Amount - Discount + Fixed GST
  const finalTotal = Math.max(baseAmount + gstAmount - discountAmount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm({
        baseAmount: Number(baseAmount.toFixed(2)),
        gstAmount: Number(gstAmount.toFixed(2)),
        discountAmount: Number(discountAmount.toFixed(2)),
        finalDiscountedAmount: Number(finalTotal.toFixed(2)),
        paymentMode
      });
      onClose();
    } catch (err: any) {
      setError(err || 'Failed to complete order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-surface border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
        >
          <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Receipt className="text-emerald-400" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Order Receipt</h2>
                <p className="text-sm text-slate-400">Order #{order.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-white/5"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col max-h-[70vh]">
            <div className="p-6 pb-4 shrink-0 border-b border-white/10 z-10 bg-surface">
              {error && (
                <div className="p-4 mb-6 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
                  {error}
                </div>
              )}

              {/* Discount Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Apply Discount</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDiscountType('PERCENTAGE')}
                    className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      discountType === 'PERCENTAGE'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 bg-black/20 text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('FLAT')}
                    className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      discountType === 'FLAT'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 bg-black/20 text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    Flat Amount (₹)
                  </button>
                </div>

                <div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                      {discountType === 'PERCENTAGE' ? '%' : '₹'}
                    </span>
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 text-slate-200 pl-10 pr-4 py-3 rounded-xl font-sans text-base transition-all duration-300 outline-none focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-light)]"
                      placeholder={discountType === 'PERCENTAGE' ? "Enter percentage (e.g., 10)" : "Enter amount (e.g., 50)"}
                      min="0"
                      step={discountType === 'PERCENTAGE' ? "1" : "0.01"}
                      max={discountType === 'PERCENTAGE' ? "100" : baseAmount}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Mode Section */}
              <div className="space-y-4 mt-6">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Payment Mode</h3>
                <div className="grid grid-cols-3 gap-3">
                  {['CASH', 'CARD', 'UPI'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode as any)}
                      className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${
                        paymentMode === mode
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-white/10 bg-black/20 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {/* Order Summary */}
              <div className="bg-black/20 rounded-xl border border-white/5 p-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Order Items</h3>
                <div className="space-y-2 mb-4">
                  {order.items.map((item, index) => (
                    <div key={`item-${index}`} className="flex justify-between text-sm">
                      <span className="text-slate-400">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-slate-200">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 pt-3 space-y-2 font-medium">
                  <div className="flex justify-between text-slate-400">
                    <span>Base Amount</span>
                    <span>₹{baseAmount.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount Applied</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>GST (5%)</span>
                    <span>₹{gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-400 pt-3 border-t border-white/5 mt-2">
                    <span className="font-bold uppercase tracking-wider text-sm">Grand Total</span>
                    <span className="text-2xl font-black tracking-tight">₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-4 shrink-0 border-t border-white/10 flex justify-end gap-3 bg-surface">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 border border-white/10 bg-transparent text-slate-300 hover:bg-white/5"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 border-none bg-emerald-500 text-white hover:bg-emerald-600 hover:-translate-y-[1px] disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_4px_14px_0_rgba(16,185,129,0.3)]"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <CheckCircle size={18} />
                )}
                Confirm & Complete
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
