'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CreditCard, Banknote, Smartphone, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { updateBookingPaymentStatus } from '../../lib/roomBookApi';

interface ChangePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSuccess: (updatedBooking?: any) => void;
}

type PaymentModeOption = 'CASH' | 'CARD' | 'UPI';

export default function ChangePaymentModal({
  isOpen,
  onClose,
  booking,
  onSuccess
}: ChangePaymentModalProps) {
  const [paymentMode, setPaymentMode] = useState<PaymentModeOption>('CASH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && booking) {
      setPaymentMode(booking.paymentMode || 'CASH');
      setError(null);
      setLoading(false);
    }
  }, [isOpen, booking]);

  if (!isOpen || !booking) return null;

  const totalAmount = Number(booking.totalAmount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await updateBookingPaymentStatus(booking.id, {
        paymentStatus: 'PAID',
        paymentMode
      });
      onSuccess(res.booking || { ...booking, paymentStatus: 'PAID', paymentMode });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update payment status');
    } finally {
      setLoading(false);
    }
  };

  const paymentModes: { id: PaymentModeOption; label: string; desc: string; icon: any }[] = [
    {
      id: 'CASH',
      label: 'Cash',
      desc: 'Physical currency received at front desk',
      icon: Banknote
    },
    {
      id: 'CARD',
      label: 'Card (POS)',
      desc: 'Debit / Credit card swipe or tap',
      icon: CreditCard
    },
    {
      id: 'UPI',
      label: 'UPI / QR',
      desc: 'GPay, PhonePe, Paytm or Net Banking',
      icon: Smartphone
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#12141c] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col relative"
        >
          {/* Top subtle glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

          {/* Header */}
          <div className="flex justify-between items-center p-5 sm:p-6 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <CreditCard size={22} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white tracking-tight">Update Payment Status</h2>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>Booking #{booking.bookingId || booking.id}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-500" />
                  <span className="text-slate-300 font-medium">{booking.guestName || 'Guest'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-slate-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5 disabled:opacity-50 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-xl flex items-start gap-2.5 text-xs leading-relaxed"
              >
                <AlertCircle size={16} className="shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1 font-medium">{error}</div>
              </motion.div>
            )}

            {/* Bill Summary Banner */}
            <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                  Total Room Amount
                </div>
                <div className="text-2xl font-black text-white font-mono tracking-tight">
                  ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Current: {booking.paymentStatus}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Will be changed to <span className="text-emerald-400 font-bold">PAID</span></p>
              </div>
            </div>

            {/* Select Payment Mode */}
            <div>
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2.5">
                Select Payment Mode <span className="text-emerald-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {paymentModes.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = paymentMode === mode.id;

                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setPaymentMode(mode.id);
                        setError(null);
                      }}
                      disabled={loading}
                      className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 relative cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/50 shadow-lg shadow-emerald-500/10 text-white'
                          : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                          isSelected
                            ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400/40'
                            : 'bg-white/5 text-slate-400 border-white/10'
                        }`}>
                          <Icon size={18} />
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                            <CheckCircle2 size={13} />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className={`font-black text-sm tracking-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {mode.label}
                        </div>
                        <div className="text-[10px] text-slate-400 leading-snug mt-0.5 line-clamp-2">
                          {mode.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-300">
              <ShieldCheck size={18} className="shrink-0 text-emerald-400" />
              <span>Once marked as <strong>PAID</strong>, the guest can be smoothly <strong>Checked Out</strong> from the front desk.</span>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-white/10 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-extrabold transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                <span>Mark as Paid ({paymentMode})</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
