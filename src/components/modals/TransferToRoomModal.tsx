import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Phone } from 'lucide-react';

interface TransferToRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (guestPhone: string) => Promise<void>;
  orderId: number;
}

export default function TransferToRoomModal({ isOpen, onClose, onSubmit, orderId }: TransferToRoomModalProps) {
  const [guestPhone, setGuestPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestPhone) {
      setError('Guest phone number is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(guestPhone);
      setGuestPhone('');
      onClose();
    } catch (err: any) {
      setError(err || 'Failed to transfer order');
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
          className="bg-surface border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          <div className="flex justify-between items-center p-4 md:p-6 border-b border-white/10 bg-surface/80">
            <h2 className="text-xl font-bold text-slate-100">Transfer Order #{orderId} to Room</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-white/5"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
            {error && (
              <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Guest Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 text-slate-200 pl-11 pr-4 py-3 rounded-xl font-sans text-sm outline-none focus:border-primary placeholder-slate-500"
                  placeholder="Enter guest's phone number"
                  required
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                The order total will be added to the active room booking associated with this phone number.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl font-bold text-base transition-all duration-200 border-none bg-primary text-white hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Confirm Transfer'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
