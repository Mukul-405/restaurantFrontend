import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Phone, Calendar, User, Mail, Bed, Building2, CheckCircle, CreditCard, Printer, Edit2, Tag, AlertCircle } from 'lucide-react';
import { getBookingById, checkOutBooking, editBookingRooms, cancelBooking } from '../../lib/roomBookApi';
import { getRoomTypes, RoomType } from '../../lib/roomsApi';
import { printBookingBill } from '../../utils/printReceipt';
import toast from 'react-hot-toast';
import EditGuestModal from './EditGuestModal';
import PrintBookingBillModal from './PrintBookingBillModal';

interface GuestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number | null;
  onRefresh?: () => void;
}

export default function GuestDetailsModal({ isOpen, onClose, bookingId, onRefresh }: GuestDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [isEditGuestModalOpen, setIsEditGuestModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  
  // Views inside modal
  const [mode, setMode] = useState<'view' | 'editRooms' | 'checkout' | 'cancel'>('view');
  
  // Checkout state
  const [roomDiscountType, setRoomDiscountType] = useState<'FLAT' | 'PERCENT'>('FLAT');
  const [roomDiscountValue, setRoomDiscountValue] = useState<number | ''>('');

  const [foodDiscountType, setFoodDiscountType] = useState<'FLAT' | 'PERCENT'>('FLAT');
  const [foodDiscountValue, setFoodDiscountValue] = useState<number | ''>('');

  const roomTax = useMemo(() => {
    if (!booking) return 0;
    const dbTax = Number(booking.taxAmount || 0);
    const rawTotal = Number(booking.totalAmount || 0);
    const roomsList = Array.isArray(booking.rooms) ? booking.rooms : [];
    const sumRoomPrices = roomsList.reduce((sum: number, r: any) => sum + (Number(r.price) || 0), 0);

    if (dbTax > 0) {
      return dbTax;
    } else if (sumRoomPrices > 0 && Math.abs(sumRoomPrices - rawTotal) < 1) {
      return Number((sumRoomPrices * 0.05).toFixed(2));
    } else if (rawTotal > 0) {
      return Number((rawTotal - rawTotal / 1.05).toFixed(2));
    }
    return 0;
  }, [booking]);

  const roomBase = useMemo(() => {
    if (!booking) return 0;
    const dbTax = Number(booking.taxAmount || 0);
    const rawTotal = Number(booking.totalAmount || 0);
    const roomsList = Array.isArray(booking.rooms) ? booking.rooms : [];
    const sumRoomPrices = roomsList.reduce((sum: number, r: any) => sum + (Number(r.price) || 0), 0);

    if (dbTax > 0) {
      return Math.max(0, Number((rawTotal - dbTax).toFixed(2)));
    } else if (sumRoomPrices > 0 && Math.abs(sumRoomPrices - rawTotal) < 1) {
      return sumRoomPrices;
    } else if (rawTotal > 0) {
      return Number((rawTotal / 1.05).toFixed(2));
    }
    return 0;
  }, [booking]);

  const roomTotal = useMemo(() => {
    return Number((roomBase + roomTax).toFixed(2));
  }, [roomBase, roomTax]);

  const roomDiscountAmount = useMemo(() => {
    if (!roomDiscountValue || roomBase <= 0) return 0;
    if (roomDiscountType === 'FLAT') {
      return Math.min(roomBase, Number(roomDiscountValue));
    } else {
      const pct = Math.min(100, Number(roomDiscountValue));
      return Number(((roomBase * pct) / 100).toFixed(2));
    }
  }, [roomDiscountType, roomDiscountValue, roomBase]);

  const foodBase = useMemo(() => {
    const foodOrdersArr: any[] = Array.isArray(booking?.foodOrders) ? booking.foodOrders : [];
    let base = foodOrdersArr.reduce((sum, f) => sum + (Number(f.price || 0) * Number(f.quantity || 0)), 0);
    const foodTotal = Number(booking?.foodTotalAmount || 0);
    if (base === 0 && foodTotal > 0) {
      base = foodTotal / 1.05;
    }
    return base;
  }, [booking]);

  const foodDiscountAmount = useMemo(() => {
    if (!foodDiscountValue || foodBase <= 0) return 0;
    if (foodDiscountType === 'FLAT') {
      return Math.min(foodBase, Number(foodDiscountValue));
    } else {
      const pct = Math.min(100, Number(foodDiscountValue));
      return Number(((foodBase * pct) / 100).toFixed(2));
    }
  }, [foodDiscountType, foodDiscountValue, foodBase]);
  
  // Edit Rooms state
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [assignments, setAssignments] = useState<{ id: number; roomCode: string; roomNumber: string }[]>([]);

  useEffect(() => {
    if (isOpen && bookingId) {
      setMode('view');
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
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditRooms = async () => {
    try {
      setLoading(true);
      const rTypes = await getRoomTypes();
      setRoomTypes(rTypes.filter(rt => rt.isActive));
      
      const initialAssignments = (booking?.rooms || []).map((r: any, i: number) => ({
        id: i,
        roomCode: r.roomCode,
        roomNumber: r.roomNumber || ''
      }));
      setAssignments(initialAssignments);
      setMode('editRooms');
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch room types');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditRooms = async () => {
    if (assignments.some(a => !a.roomNumber)) {
      toast.error('Please select a room number for all rooms');
      return;
    }
    setSubmitting(true);
    try {
      await editBookingRooms(bookingId!, assignments);
      toast.success('Room allocations updated successfully');
      await fetchBooking();
      if (onRefresh) onRefresh();
      setMode('view');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to update rooms');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCheckout = async () => {
    setSubmitting(true);
    try {
      await checkOutBooking(bookingId!, roomDiscountAmount, foodDiscountAmount);
      toast.success('Guest checked out successfully');
      if (onRefresh) onRefresh();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to checkout guest');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async () => {
    setSubmitting(true);
    try {
      await cancelBooking(bookingId!);
      toast.success('Booking cancelled successfully');
      if (onRefresh) onRefresh();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to cancel booking');
    } finally {
      setSubmitting(false);
    }
  };

  const roomsList = Array.isArray(booking?.rooms) ? booking.rooms : [];
  const isCheckedIn = booking?.status === 'CHECKED_IN';

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-surface border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 md:p-5 border-b border-white/10 bg-surface/80 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/20 text-primary rounded-lg">
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    {mode === 'view' ? 'Booking & Guest Details' : mode === 'editRooms' ? 'Edit Room Allocation' : 'Guest Checkout'}
                  </h2>
                  {booking?.channel && (
                    <span className="text-xs text-slate-400">Channel: {booking.channel}</span>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-white/5">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
              {loading || !booking ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : mode === 'editRooms' ? (
                /* EDIT ROOMS VIEW */
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">Re-assign physical room numbers for this checked-in booking:</p>
                  <div className="space-y-3">
                    {assignments.map((assignment, index) => {
                      const roomType = roomTypes.find(rt => rt.roomCode === assignment.roomCode);
                      const availableRooms = (roomType?.rooms as any[])?.filter(
                        (r: any) => r.status === 'no status' || r.userRoomBookingId === bookingId
                      ) || [];

                      return (
                        <div key={assignment.id} className="bg-black/30 border border-white/10 rounded-xl p-3.5 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-200">Room #{index + 1} ({roomType?.name || assignment.roomCode})</span>
                            <span className="text-slate-400 font-mono">Code: {assignment.roomCode}</span>
                          </div>
                          <div>
                            <select
                              value={assignment.roomNumber}
                              onChange={(e) => {
                                const newNumber = e.target.value;
                                setAssignments(prev => prev.map(a => a.id === assignment.id ? { ...a, roomNumber: newNumber } : a));
                              }}
                              className="w-full bg-surface/60 border border-white/10 text-white text-xs rounded-lg p-2.5 outline-none focus:border-primary"
                            >
                              <option value="" disabled className="bg-surface text-slate-400">Select physical room...</option>
                              {availableRooms.map((r: any) => (
                                <option key={r.roomNumber} value={r.roomNumber} className="bg-surface text-white">
                                  Room {r.roomNumber} {r.userRoomBookingId === bookingId ? '(Currently Assigned)' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      onClick={() => setMode('view')}
                      className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEditRooms}
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20"
                    >
                      {submitting ? <Loader2 size={14} className="animate-spin" /> : <Bed size={14} />}
                      Save Allocation
                    </button>
                  </div>
                </div>
              ) : mode === 'checkout' ? (
                /* CHECKOUT VIEW */
                <div className="space-y-4">
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3">
                    {/* Room Charge Row */}
                    <div className="flex justify-between items-start text-sm">
                      <span className="text-slate-300 font-medium flex items-center gap-2 mt-1">
                        <Bed size={15} className="text-slate-400" /> Room Bill
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                          booking.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {booking.paymentStatus}
                        </span>
                        <span className="text-white font-bold font-mono">₹{roomTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {roomTotal > 0 && (
                      <div className="bg-white/5 rounded-xl p-2.5 text-xs space-y-1 text-slate-400">
                        <div className="flex justify-between items-center">
                          <span>Base Amount:</span>
                          <span className="text-slate-200 font-mono">₹{roomBase.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>GST (5%):</span>
                          <span className="text-slate-200 font-mono">₹{roomTax.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {/* Room Bill Discount Controls */}
                    {booking.paymentStatus !== 'PAID' && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-medium">Discount Mode:</span>
                          <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10 text-[11px] font-bold">
                            <button
                              type="button"
                              onClick={() => {
                                setRoomDiscountType('FLAT');
                                setRoomDiscountValue('');
                              }}
                              className={`px-2.5 py-0.5 rounded-md transition-all ${
                                roomDiscountType === 'FLAT' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              ₹ Flat
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRoomDiscountType('PERCENT');
                                setRoomDiscountValue('');
                              }}
                              className={`px-2.5 py-0.5 rounded-md transition-all ${
                                roomDiscountType === 'PERCENT' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              % Off
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex items-center">
                            {roomDiscountType === 'FLAT' && (
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                            )}
                            <input 
                              type="number" 
                              min="0"
                              max={roomDiscountType === 'PERCENT' ? 100 : roomBase}
                              value={roomDiscountValue}
                              onChange={(e) => setRoomDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="0"
                              className={`bg-white/5 border border-white/10 rounded-xl py-1 text-xs text-white text-right focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono ${
                                roomDiscountType === 'FLAT' ? 'pl-6 pr-2.5 w-24' : 'pl-2.5 pr-6 w-20'
                              }`}
                            />
                            {roomDiscountType === 'PERCENT' && (
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-400 text-xs font-bold">%</span>
                            )}
                          </div>

                          {roomDiscountAmount > 0 && (
                            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              {roomDiscountType === 'FLAT'
                                ? `${((roomDiscountAmount / roomBase) * 100).toFixed(1)}% off`
                                : `-₹${roomDiscountAmount.toFixed(2)}`}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Restaurant Bill Row & Breakdown */}
                    {(() => {
                      const foodGst = foodBase * 0.05;
                      const foodTotalIncTax = foodBase + foodGst;

                      return (
                        <div className="pt-3 border-t border-white/5 space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-300 font-medium flex items-center gap-2">
                              <Tag size={15} className="text-slate-400" /> Restaurant Bill
                            </span>
                            <span className="text-white font-bold font-mono">₹{foodTotalIncTax.toFixed(2)}</span>
                          </div>

                          {foodTotalIncTax > 0 && (
                            <div className="bg-white/5 rounded-xl p-2.5 text-xs space-y-1 text-slate-400">
                              <div className="flex justify-between items-center">
                                <span>Base Amount:</span>
                                <span className="text-slate-200 font-mono">₹{foodBase.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>GST (5%):</span>
                                <span className="text-slate-200 font-mono">₹{foodGst.toFixed(2)}</span>
                              </div>
                            </div>
                          )}

                          {foodTotalIncTax > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-medium">Discount Mode:</span>
                                <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10 text-[11px] font-bold">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFoodDiscountType('FLAT');
                                      setFoodDiscountValue('');
                                    }}
                                    className={`px-2.5 py-0.5 rounded-md transition-all ${
                                      foodDiscountType === 'FLAT' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    ₹ Flat
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFoodDiscountType('PERCENT');
                                      setFoodDiscountValue('');
                                    }}
                                    className={`px-2.5 py-0.5 rounded-md transition-all ${
                                      foodDiscountType === 'PERCENT' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    % Off
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="relative flex items-center">
                                  {foodDiscountType === 'FLAT' && (
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                                  )}
                                  <input 
                                    type="number" 
                                    min="0"
                                    max={foodDiscountType === 'PERCENT' ? 100 : foodBase}
                                    value={foodDiscountValue}
                                    onChange={(e) => setFoodDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="0"
                                    className={`bg-white/5 border border-white/10 rounded-xl py-1 text-xs text-white text-right focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono ${
                                      foodDiscountType === 'FLAT' ? 'pl-6 pr-2.5 w-24' : 'pl-2.5 pr-6 w-20'
                                    }`}
                                  />
                                  {foodDiscountType === 'PERCENT' && (
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-400 text-xs font-bold">%</span>
                                  )}
                                </div>

                                {foodDiscountAmount > 0 && (
                                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                    {foodDiscountType === 'FLAT'
                                      ? `${((foodDiscountAmount / foodBase) * 100).toFixed(1)}% off base`
                                      : `-₹${foodDiscountAmount.toFixed(2)}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                      <div className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-0.5">Final Amount Due</div>
                      <div className="text-[11px] text-slate-500">
                        {booking.paymentStatus === 'PAID' ? 'Room bill paid (food balance)' : 'Includes Room + Restaurant - Discounts'}
                      </div>
                    </div>
                    <div className="text-emerald-400 font-black text-2xl font-mono tracking-tight">
                      ₹{Math.max(0, (
                        (booking.paymentStatus !== 'PAID' ? Math.max(0, roomTotal - (roomDiscountAmount || 0)) : 0) +
                        Math.max(0, Number(booking.foodTotalAmount || 0) - (foodDiscountAmount || 0))
                      )).toFixed(2)}
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      onClick={() => setMode('view')}
                      className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-semibold"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setIsPrintModalOpen(true)}
                      className="flex-1 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Printer size={14} /> Print Bill
                    </button>
                    <button
                      onClick={handleConfirmCheckout}
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Checking out...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={14} />
                          <span>Confirm Checkout</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : mode === 'cancel' ? (
                /* CANCEL VIEW */
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center space-y-3">
                    <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-2">
                      <AlertCircle size={24} />
                    </div>
                    <h3 className="text-red-400 font-bold text-lg">Cancel Booking?</h3>
                    <p className="text-slate-400 text-sm">
                      Are you sure you want to cancel this booking for <strong className="text-slate-200">{booking.guestName}</strong>? 
                      This action cannot be undone and will release the inventory back to the channel manager.
                    </p>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      onClick={() => setMode('view')}
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-semibold"
                    >
                      Keep Booking
                    </button>
                    <button
                      onClick={handleCancelBooking}
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/20"
                    >
                      {submitting ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                      Yes, Cancel It
                    </button>
                  </div>
                </div>
              ) : (
                /* DEFAULT VIEW */
                <>
                  {/* Guest Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between bg-black/20 p-3.5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg shrink-0"><User size={18} /></div>
                        <div className="overflow-hidden">
                          <div className="text-xs text-slate-400 mb-0.5">Guest Name</div>
                          <div className="text-white font-bold truncate">{booking.guestName || 'Unknown'}</div>
                        </div>
                      </div>
                      {(booking.status === 'RESERVED' || booking.status === 'CHECKED_IN') && (
                        <button
                          onClick={() => setIsEditGuestModalOpen(true)}
                          className="px-2.5 py-1 bg-white/10 hover:bg-violet-600/30 active:scale-95 text-slate-200 hover:text-white border border-white/20 hover:border-violet-400/60 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm"
                          title="Edit Guest Details"
                        >
                          <Edit2 size={12} className="text-violet-400" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between bg-black/20 p-3.5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0"><Phone size={18} /></div>
                        <div className="overflow-hidden">
                          <div className="text-xs text-slate-400 mb-0.5">Phone Number</div>
                          <div className="text-white font-bold truncate">{booking.guestPhone}</div>
                        </div>
                      </div>
                      {(booking.status === 'RESERVED' || booking.status === 'CHECKED_IN') && (
                        <button
                          onClick={() => setIsEditGuestModalOpen(true)}
                          className="px-2.5 py-1 bg-white/10 hover:bg-violet-600/30 active:scale-95 text-slate-200 hover:text-white border border-white/20 hover:border-violet-400/60 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm"
                          title="Edit Guest Details"
                        >
                          <Edit2 size={12} className="text-violet-400" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>

                    {booking.guestEmail && (
                      <div className="flex items-center gap-3 bg-black/20 p-3.5 rounded-xl border border-white/5 sm:col-span-2">
                        <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg shrink-0"><Mail size={18} /></div>
                        <div className="overflow-hidden">
                          <div className="text-xs text-slate-400 mb-0.5">Email</div>
                          <div className="text-white font-bold truncate">{booking.guestEmail}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stay Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 bg-black/20 p-3.5 rounded-xl border border-white/5">
                      <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0"><Calendar size={18} /></div>
                      <div>
                        <div className="text-xs text-slate-400 mb-0.5">Check-In</div>
                        <div className="text-white font-bold text-sm">
                          {booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : '-'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-black/20 p-3.5 rounded-xl border border-white/5">
                      <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg shrink-0"><Calendar size={18} /></div>
                      <div>
                        <div className="text-xs text-slate-400 mb-0.5">Check-Out</div>
                        <div className="text-white font-bold text-sm">
                          {booking.checkOut ? new Date(booking.checkOut).toLocaleDateString() : '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Billing Summary Section */}
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                        <CreditCard size={18} className="text-primary" />
                        <span>Billing Summary</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                        booking.paymentStatus === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {booking.paymentStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="bg-surface/80 border border-white/10 rounded-xl p-3 space-y-1">
                        <div className="text-slate-400 font-semibold flex items-center justify-between">
                          <span>Room Base:</span>
                          <span className="text-slate-200 font-mono font-bold">₹{roomBase.toFixed(2)}</span>
                        </div>
                        <div className="text-slate-400 font-semibold flex items-center justify-between">
                          <span>Room GST (5%):</span>
                          <span className="text-emerald-400 font-mono font-bold">+₹{roomTax.toFixed(2)}</span>
                        </div>
                        <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-slate-100 font-bold">
                          <span>Room Total:</span>
                          <span className="font-mono text-emerald-400">₹{roomTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="bg-surface/80 border border-white/10 rounded-xl p-3 space-y-1">
                        <div className="text-slate-400 font-semibold flex items-center justify-between">
                          <span>Restaurant Food:</span>
                          <span className="text-slate-200 font-mono font-bold">₹{Number(booking.foodTotalAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="text-slate-400 font-semibold flex items-center justify-between">
                          <span>Discounts:</span>
                          <span className="text-rose-400 font-mono font-bold">-₹{(Number(booking.roomDiscountAmount || 0) + Number(booking.foodDiscountAmount || 0)).toFixed(2)}</span>
                        </div>
                        <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-slate-100 font-bold">
                          <span>Grand Total:</span>
                          <span className="font-mono text-emerald-400">
                            ₹{Math.max(0, roomTotal + Number(booking.foodTotalAmount || 0) - Number(booking.roomDiscountAmount || 0) - Number(booking.foodDiscountAmount || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Checked In Rooms Section */}
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                        <Bed size={18} className="text-emerald-400" />
                        <span>Checked-In Rooms</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {roomsList.length} {roomsList.length === 1 ? 'Room' : 'Rooms'}
                      </span>
                    </div>

                    {roomsList.length === 0 ? (
                      <div className="text-slate-400 text-xs text-center py-3">No room numbers assigned yet</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {roomsList.map((r: any, idx: number) => (
                          <div key={idx} className="bg-surface/80 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-sm border border-emerald-500/30">
                                {r.roomNumber || `#${idx + 1}`}
                              </div>
                              <div>
                                <div className="font-bold text-white text-sm">
                                  {r.roomNumber ? `Room ${r.roomNumber}` : `Room ${idx + 1}`}
                                </div>
                                <div className="text-xs text-slate-400">
                                  Code: <span className="font-semibold text-slate-300">{r.roomCode || 'Standard'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right text-xs">
                              <div className="font-bold text-slate-200">{r.adults ?? 1} Adult{(r.adults ?? 1) > 1 ? 's' : ''}</div>
                              {Number(r.children) > 0 && (
                                <div className="text-[11px] text-slate-400">{r.children} Child{(r.children) > 1 ? 'ren' : ''}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions for Checked-In Booking */}
                  {isCheckedIn && (
                    <div className="pt-2 flex items-center gap-3">
                      <button
                        onClick={handleOpenEditRooms}
                        className="flex-1 py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 font-bold text-xs transition-all flex items-center justify-center gap-2"
                      >
                        <Edit2 size={15} /> Change Room
                      </button>
                      <button
                        onClick={() => setIsPrintModalOpen(true)}
                        className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold text-xs transition-all flex items-center justify-center gap-2"
                      >
                        <Printer size={15} /> Print
                      </button>
                      <button
                        onClick={() => setMode('checkout')}
                        className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={15} /> Check Out
                      </button>
                    </div>
                  )}

                  {booking?.status === 'CHECKED_OUT' && (
                    <div className="pt-2 flex items-center justify-end">
                      <button
                        onClick={() => setIsPrintModalOpen(true)}
                        className="py-3 px-6 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold text-xs transition-all flex items-center justify-center gap-2"
                      >
                        <Printer size={15} /> Print Bill
                      </button>
                    </div>
                  )}

                  {/* Actions for Reserved Booking */}
                  {booking?.status === 'RESERVED' && (
                    <div className="pt-2 flex items-center justify-between gap-3">
                      <button
                        onClick={() => setIsPrintModalOpen(true)}
                        className="py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold text-xs transition-all flex items-center justify-center gap-2"
                      >
                        <Printer size={15} /> Print Bill
                      </button>
                      <button
                        onClick={handleCancelBooking}
                        disabled={submitting}
                        className="py-3 px-6 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {submitting ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
                        Cancel Booking
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    <EditGuestModal
      isOpen={isEditGuestModalOpen}
      onClose={() => setIsEditGuestModalOpen(false)}
      booking={booking}
      onSuccess={() => {
        fetchBooking();
        onRefresh?.();
      }}
    />

    <PrintBookingBillModal
      isOpen={isPrintModalOpen}
      onClose={() => setIsPrintModalOpen(false)}
      booking={booking}
      roomDiscount={roomDiscountAmount}
      foodDiscount={foodDiscountAmount}
    />
    </>
  );
}
