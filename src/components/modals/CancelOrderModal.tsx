import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';
import { updateOrder } from '../../store/slices/orderSlice';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  onSuccess?: () => void;
}

export default function CancelOrderModal({ isOpen, onClose, orderId, onSuccess }: CancelOrderModalProps) {
  const dispatch = useAppDispatch();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Cancellation reason is required');
      return;
    }
    if (!orderId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await dispatch(updateOrder({
        id: orderId,
        data: { status: 'CANCELLED', cancellationReason: reason }
      })).unwrap();
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err || 'Failed to cancel order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-surface border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
        >
          <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
            <h2 className="text-xl font-bold text-slate-100">Cancel Order #{orderId}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-white/5"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Reason for Cancellation <span className="text-danger">*</span>
              </label>
              <input
                list="cancel-reasons"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-black/20 border border-white/10 text-slate-200 px-4 py-3 rounded-xl font-sans text-base transition-all duration-300 outline-none focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-light)]"
                placeholder="Select or type a reason..."
                required
              />
              <datalist id="cancel-reasons">
                <option value="CUSTOMER_CHANGED_MIND" />
                <option value="DUPLICATE_ORDER" />
                <option value="ITEM_OUT_OF_STOCK" />
                <option value="KITCHEN_UNABLE_TO_PREPARE" />
                <option value="OTHER" />
              </datalist>
              <p className="text-xs text-slate-500 mt-2">
                You can select from the dropdown or manually type your own reason.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 border border-white/10 bg-transparent text-slate-300 hover:bg-white/5"
                disabled={isSubmitting}
              >
                Keep Order
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 border-none bg-danger text-white hover:bg-danger-hover hover:-translate-y-[1px] disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_4px_14px_0_rgba(239,68,68,0.3)]"
              >
                {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                Confirm Cancellation
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
