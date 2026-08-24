import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Tag, Percent, IndianRupee, CheckCircle2 } from 'lucide-react';
import { Order } from '../../store/slices/orderSlice';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onConfirm: (amounts: {
    baseAmount: number;
    gstAmount: number;
    discountAmount: number;
    finalDiscountedAmount: number;
  }) => Promise<void>;
}

export default function DiscountModal({ isOpen, onClose, order, onConfirm }: DiscountModalProps) {
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && order) {
      setError(null);
      setIsSubmitting(false);

      const existingDiscount = Number(order.discountAmount || 0);
      const base = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      if (existingDiscount > 0 && base > 0) {
        const calculatedPercent = (existingDiscount / base) * 100;
        const roundedPercent = Number(calculatedPercent.toFixed(2));

        if (Math.abs((base * roundedPercent) / 100 - existingDiscount) < 0.01 && (Number.isInteger(roundedPercent) || Number.isInteger(roundedPercent * 10))) {
          setDiscountType('PERCENTAGE');
          setDiscountValue(roundedPercent.toString());
        } else {
          setDiscountType('FLAT');
          setDiscountValue(existingDiscount.toString());
        }
      } else {
        setDiscountType('PERCENTAGE');
        setDiscountValue('');
      }
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const baseAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gstAmount = baseAmount * 0.05;

  const parsedValue = parseFloat(discountValue) || 0;

  let discountAmount = 0;
  if (discountType === 'PERCENTAGE') {
    const clampedPercent = Math.min(Math.max(parsedValue, 0), 100);
    discountAmount = (baseAmount * clampedPercent) / 100;
  } else {
    discountAmount = Math.min(Math.max(parsedValue, 0), baseAmount);
  }

  const handleTypeChange = (type: 'PERCENTAGE' | 'FLAT') => {
    if (type === discountType) return;
    if (parsedValue > 0 && baseAmount > 0) {
      if (type === 'FLAT') {
        setDiscountValue(discountAmount.toFixed(2).replace(/\.00$/, ''));
      } else {
        const pct = (parsedValue / baseAmount) * 100;
        setDiscountValue(Number(pct.toFixed(2)).toString());
      }
    }
    setDiscountType(type);
  };

  const rawTotal = baseAmount + gstAmount - discountAmount;
  const finalTotal = Math.max(Math.round(rawTotal), 0);
  const roundOff = Number((finalTotal - rawTotal).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm({
        baseAmount: Number(baseAmount.toFixed(2)),
        gstAmount: Number(gstAmount.toFixed(2)),
        discountAmount: Number(discountAmount.toFixed(2)),
        finalDiscountedAmount: finalTotal,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || err || 'Failed to apply discount');
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
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Tag size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Apply Discount</h2>
                <p className="text-sm text-slate-400">
                  Order #{order.id} {order.tableNumber ? `• Table ${order.tableNumber}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-white/5 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col max-h-[75vh]">
            <div className="p-6 pb-4 shrink-0 border-b border-white/10 z-10 bg-surface space-y-4">
              {error && (
                <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Discount Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('PERCENTAGE')}
                    className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      discountType === 'PERCENTAGE'
                        ? 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-sm'
                        : 'border-white/10 bg-black/20 text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <Percent size={16} />
                    <span>Percentage (%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('FLAT')}
                    className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      discountType === 'FLAT'
                        ? 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-sm'
                        : 'border-white/10 bg-black/20 text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <IndianRupee size={16} />
                    <span>Flat Amount (₹)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {discountType === 'PERCENTAGE' ? 'Discount Percentage' : 'Discount Amount'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    {discountType === 'PERCENTAGE' ? '%' : '₹'}
                  </span>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 text-slate-100 pl-10 pr-4 py-3 rounded-xl font-sans text-base transition-all outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    placeholder={discountType === 'PERCENTAGE' ? 'Enter percentage (e.g. 10)' : 'Enter amount (e.g. 50)'}
                    min="0"
                    step={discountType === 'PERCENTAGE' ? '1' : '0.01'}
                    max={discountType === 'PERCENTAGE' ? '100' : baseAmount}
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="bg-black/20 rounded-xl border border-white/5 p-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Summary Breakdown
                </h3>
                <div className="space-y-2 font-medium text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Base Amount</span>
                    <span className="text-slate-200">₹{baseAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-amber-400">
                    <span>Discount Applied</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>GST (5%)</span>
                    <span className="text-slate-200">₹{gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Round Off</span>
                    <span className={roundOff !== 0 ? 'text-amber-400 font-mono' : 'text-slate-400 font-mono'}>
                      {roundOff > 0 ? `+₹${roundOff.toFixed(2)}` : roundOff < 0 ? `-₹${Math.abs(roundOff).toFixed(2)}` : '₹0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-400 pt-3 border-t border-white/5 mt-2">
                    <span className="font-bold uppercase tracking-wider text-sm">New Total (Pending)</span>
                    <span className="text-2xl font-black tracking-tight">₹{Math.round(finalTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-4 shrink-0 border-t border-white/10 flex justify-end gap-3 bg-surface">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border border-white/10 bg-transparent text-slate-300 hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                <span>Save Discount</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
