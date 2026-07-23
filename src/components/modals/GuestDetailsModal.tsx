import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Phone, Calendar, User, Mail } from 'lucide-react';
import { getBookingById } from '../../lib/roomBookApi';

interface GuestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number | null;
}

export default function GuestDetailsModal({ isOpen, onClose, bookingId }: GuestDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchBooking();
    }
  }, [isOpen, bookingId]);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const data = await getBookingById(bookingId!);
      setBooking(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-surface border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-surface/80 backdrop-blur-md sticky top-0 z-20">
              <h2 className="text-xl font-bold text-slate-100">Guest Details</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-white/5">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {loading || !booking ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><User size={20} /></div>
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">Guest Name</div>
                      <div className="text-white font-bold">{booking.guestName || 'Unknown'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><Phone size={20} /></div>
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">Phone Number</div>
                      <div className="text-white font-bold">{booking.guestPhone}</div>
                    </div>
                  </div>

                  {booking.guestEmail && (
                    <div className="flex items-center gap-3 bg-black/20 p-4 rounded-xl border border-white/5">
                      <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg"><Mail size={20} /></div>
                      <div>
                        <div className="text-xs text-slate-400 mb-0.5">Email</div>
                        <div className="text-white font-bold">{booking.guestEmail}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg"><Calendar size={20} /></div>
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">Check-out Date</div>
                      <div className="text-white font-bold">{new Date(booking.checkOut).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
