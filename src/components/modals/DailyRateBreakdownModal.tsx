import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, IndianRupee, Bed, Calendar, Users, Edit2, Save, Loader2, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';
import { updateRoomDailyPrices } from '../../lib/roomBookApi';

interface DailyRateBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSuccess?: (updatedBooking: any) => void;
}

export default function DailyRateBreakdownModal({
  isOpen,
  onClose,
  booking,
  onSuccess
}: DailyRateBreakdownModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableRooms, setEditableRooms] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const checkIn = booking ? new Date(booking.checkIn) : new Date();
  const checkOut = booking ? new Date(booking.checkOut) : new Date();
  const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

  const isEditable = booking && (booking.status === 'CHECKED_IN' || booking.status === 'RESERVED') && booking.paymentStatus !== 'PAID';

  const resetRoomsFromBooking = () => {
    if (!booking) return;
    const bookingRooms: any[] = Array.isArray(booking.rooms) ? booking.rooms : [];
    const webhookRooms: any[] = Array.isArray(booking.webhookPayload?.rooms) ? booking.webhookPayload.rooms : [];

    const initialRooms = bookingRooms.map((r: any, idx: number) => {
      const wr = webhookRooms[idx] || webhookRooms.find((w: any) => w.roomCode === (r.roomCode || r.roomCodeId));
      let prices: { date: string; sellRate: number }[] = [];

      if (Array.isArray(wr?.prices) && wr.prices.length > 0) {
        prices = wr.prices.map((p: any) => ({
          date: p.date,
          sellRate: Number(p.sellRate) || 0
        }));
      } else {
        const dailyRate = Number(r.price) || 0;
        prices = Array.from({ length: nights }).map((_, dIdx) => {
          const d = new Date(checkIn.getTime() + dIdx * 24 * 60 * 60 * 1000);
          return {
            date: d.toISOString().split('T')[0],
            sellRate: dailyRate
          };
        });
      }

      return {
        roomIndex: idx,
        roomNumber: r.roomNumber || '',
        roomCode: r.roomCode || wr?.roomCode || 'Standard',
        rateplanCode: r.rateplanCode || wr?.rateplanCode || '',
        adults: r.adults ?? 1,
        children: r.children ?? 0,
        prices
      };
    });

    setEditableRooms(initialRooms);
  };

  useEffect(() => {
    if (isOpen && booking) {
      setError('');
      setSuccessMsg('');
      setIsEditing(false);
      resetRoomsFromBooking();
    }
  }, [isOpen, booking]);

  if (!isOpen || !booking) return null;

  const handlePriceChange = (rIdx: number, pIdx: number, val: string) => {
    const numVal = Math.max(0, parseFloat(val) || 0);
    setEditableRooms(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (copy[rIdx] && copy[rIdx].prices[pIdx]) {
        copy[rIdx].prices[pIdx].sellRate = numVal;
      }
      return copy;
    });
  };

  // Live calculations
  const roomSubtotals = editableRooms.map(r => 
    (r.prices || []).reduce((sum: number, p: any) => sum + (Number(p.sellRate) || 0), 0)
  );
  const baseTotal = roomSubtotals.reduce((sum, sub) => sum + sub, 0);
  const gstAmount = Number((baseTotal * 0.05).toFixed(2));
  const newTotalAmount = Number((baseTotal + gstAmount).toFixed(2));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = editableRooms.map(r => ({
        roomIndex: r.roomIndex,
        roomCode: r.roomCode,
        rateplanCode: r.rateplanCode,
        prices: r.prices.map((p: any) => ({
          date: p.date,
          sellRate: Number(p.sellRate) || 0
        }))
      }));

      const res = await updateRoomDailyPrices(booking.id, payload);
      setSuccessMsg('Prices, GST, and Total Amount updated successfully!');
      setIsEditing(false);
      if (onSuccess) {
        onSuccess(res.booking);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to update daily prices');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-[#12141a] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <IndianRupee size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">Room Price Breakdown</h2>
                  {isEditing && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400">
                      Editing
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Booking #{booking.bookingId || booking.id} • {booking.guestName || 'Guest'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={saving}
              className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-white/5 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          {/* Stay Info Bar */}
          <div className="px-5 py-3 bg-black/30 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar size={14} className="text-amber-400 shrink-0" />
              <span>
                {checkIn.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} — {checkOut.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-semibold text-[10px]">
                {nights} Night{nights > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <span className="flex items-center gap-1">
                <Bed size={13} className="text-sky-400" />
                <span className="font-semibold text-slate-200">{editableRooms.length}</span> Room{editableRooms.length > 1 ? 's' : ''}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users size={13} className="text-emerald-400" />
                <span className="font-semibold text-slate-200">{booking.totalAdults || 1}</span> Adult{(booking.totalAdults || 1) > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mx-5 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mx-5 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Rooms and Price Breakdown List */}
          <div className="p-5 overflow-y-auto custom-scrollbar space-y-4 flex-1">
            {editableRooms.map((room, rIdx) => (
              <div
                key={rIdx}
                className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 rounded-xl p-4 space-y-3"
              >
                {/* Room Header with Type and Number */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 text-emerald-300 font-black text-xs flex items-center justify-center shrink-0">
                      {room.roomNumber || `#${rIdx + 1}`}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <span>{room.roomNumber ? `Room ${room.roomNumber}` : `Room #${rIdx + 1}`}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-semibold uppercase">
                          {room.roomCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        {room.rateplanCode && (
                          <span>Plan: <span className="font-mono text-slate-300">{room.rateplanCode}</span></span>
                        )}
                        <span>•</span>
                        <span>{room.adults}A {Number(room.children) > 0 ? `, ${room.children}C` : ''}</span>
                      </div>
                    </div>
                  </div>

                  {/* Room Subtotal */}
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Subtotal</div>
                    <div className="font-mono font-black text-amber-400 text-sm">
                      ₹{roomSubtotals[rIdx]?.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Date-wise Table */}
                <div className="bg-black/30 border border-white/5 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 px-3 py-1.5 bg-white/[0.02] border-b border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Date</span>
                    <span className="text-right">{isEditing ? 'Edit Rate (₹)' : 'Price per Night'}</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {room.prices.map((p: any, pIdx: number) => {
                      const dateObj = new Date(p.date);
                      const formattedDate = !isNaN(dateObj.getTime())
                        ? dateObj.toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short'
                          })
                        : p.date;

                      return (
                        <div
                          key={pIdx}
                          className="grid grid-cols-2 px-3 py-2 text-xs items-center hover:bg-white/[0.02] transition-colors"
                        >
                          <span className="text-slate-300 font-medium">{formattedDate}</span>
                          <div className="flex justify-end items-center">
                            {isEditing ? (
                              <div className="relative flex items-center">
                                <span className="absolute left-2.5 text-slate-400 font-mono text-xs">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="50"
                                  value={p.sellRate}
                                  onChange={(e) => handlePriceChange(rIdx, pIdx, e.target.value)}
                                  className="w-28 pl-6 pr-2 py-1 bg-black/60 border border-amber-500/40 rounded-lg text-right font-mono font-bold text-amber-400 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              </div>
                            ) : (
                              <span className="font-mono font-bold text-amber-400/95">
                                ₹{Number(p.sellRate || 0).toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer with Calculations and Actions */}
          <div className="p-4 border-t border-white/10 bg-black/40 space-y-3">
            {/* Calculation Summary Row */}
            <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 text-slate-300">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Base Total</span>
                  <span className="font-mono font-bold text-slate-200">₹{baseTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-slate-500">+</div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">GST (5%)</span>
                  <span className="font-mono font-bold text-amber-400">₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  {isEditing ? 'New Total Amount' : 'Total Amount'}
                </span>
                <span className="font-mono font-black text-emerald-400 text-lg">
                  ₹{newTotalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Buttons Row */}
            <div className="flex items-center justify-between">
              <div>
                {isEditing ? (
                  <button
                    type="button"
                    onClick={() => {
                      resetRoomsFromBooking();
                      setIsEditing(false);
                      setError('');
                    }}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
                  >
                    <RotateCcw size={13} />
                    <span>Cancel</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isEditable && !isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition-all shadow-sm"
                  >
                    <Edit2 size={13} />
                    <span>Edit Prices</span>
                  </button>
                )}

                {isEditing && (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    <span>{saving ? 'Saving...' : 'Save & Update Bill'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
