'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bed, Calendar, Users, User, Plus, Trash2, Mail, Phone, CreditCard, Loader2, Key, X, RefreshCw, Tag, AlignLeft, AlertCircle, CheckCircle2, Search, CheckCircle, Printer, ChevronLeft, ChevronRight, Edit2, Banknote, Smartphone } from 'lucide-react';
import { getRoomTypes, RoomType, getAvailability } from '../../../lib/roomsApi';
import { createBooking, BookingPayload, getBookings, checkInBooking, checkOutBooking, editBookingRooms, cancelBooking, extendCheckoutBooking } from '../../../lib/roomBookApi';
import { printBookingBill } from '../../../utils/printReceipt';
import EditGuestModal from '../../../components/modals/EditGuestModal';
import PrintBookingBillModal from '../../../components/modals/PrintBookingBillModal';
import ChangePaymentModal from '../../../components/modals/ChangePaymentModal';

export default function BookRoomPage() {
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    checkIn: '',
    checkOut: '',
    specialRequests: '',
  });

  const [rooms, setRooms] = useState<{ id: number; roomCode: string; rateplanCode: string; price: number | ''; adults: number; children: number }[]>([
    { id: 1, roomCode: '', rateplanCode: '', price: '', adults: 1, children: 0 }
  ]);

  const [assignments, setAssignments] = useState<{ id: number; roomCode: string; roomNumber: string }[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [availability, setAvailability] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [printBillModalData, setPrintBillModalData] = useState<{ booking: any; roomDiscount?: number; foodDiscount?: number } | null>(null);

  // Manage Bookings State
  const [activeTab, setActiveTab] = useState<'book' | 'manage'>('book');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [managedBookings, setManagedBookings] = useState<any[]>([]);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'ALL' | 'RESERVED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'>('CHECKED_IN');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [searchingBookings, setSearchingBookings] = useState(false);
  const [cancelingBooking, setCancelingBooking] = useState<any>(null);
  const [openingModalBookingId, setOpeningModalBookingId] = useState<number | null>(null);

  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [checkoutBooking, setCheckoutBooking] = useState<any>(null);
  const [checkoutPaymentMode, setCheckoutPaymentMode] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [roomCheckoutDiscountType, setRoomCheckoutDiscountType] = useState<'FLAT' | 'PERCENT'>('FLAT');
  const [roomCheckoutDiscountValue, setRoomCheckoutDiscountValue] = useState<number | ''>('');

  const [foodCheckoutDiscountType, setFoodCheckoutDiscountType] = useState<'FLAT' | 'PERCENT'>('FLAT');
  const [foodCheckoutDiscountValue, setFoodCheckoutDiscountValue] = useState<number | ''>('');

  const [extendBookingModalOpen, setExtendBookingModalOpen] = useState(false);
  const [extendBookingId, setExtendBookingId] = useState<number | null>(null);
  const [extendBookingCurrentCheckOut, setExtendBookingCurrentCheckOut] = useState<string>('');
  const [newCheckOutDate, setNewCheckOutDate] = useState('');
  const [extendingCheckout, setExtendingCheckout] = useState(false);
  const [extendModalError, setExtendModalError] = useState('');
  const [editingGuestBooking, setEditingGuestBooking] = useState<any>(null);
  const [paymentModalBooking, setPaymentModalBooking] = useState<any>(null);

  const [modalMode, setModalMode] = useState<'checkin' | 'edit'>('checkin');

  const nights = useMemo(() => {
    if (!formData.checkIn || !formData.checkOut) return 1;
    const inDate = new Date(formData.checkIn);
    const outDate = new Date(formData.checkOut);
    const diffTime = outDate.getTime() - inDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [formData.checkIn, formData.checkOut]);

  const roomCheckoutTax = useMemo(() => {
    if (!checkoutBooking) return 0;
    const dbTax = Number(checkoutBooking.taxAmount || 0);
    const rawTotal = Number(checkoutBooking.totalAmount || 0);
    const roomsList = Array.isArray(checkoutBooking.rooms) ? checkoutBooking.rooms : [];
    const sumRoomPrices = roomsList.reduce((sum: number, r: any) => sum + (Number(r.price) || 0), 0);

    if (dbTax > 0) {
      return dbTax;
    } else if (sumRoomPrices > 0 && Math.abs(sumRoomPrices - rawTotal) < 1) {
      return Number((sumRoomPrices * 0.05).toFixed(2));
    } else if (rawTotal > 0) {
      return Number((rawTotal - rawTotal / 1.05).toFixed(2));
    }
    return 0;
  }, [checkoutBooking]);

  const roomCheckoutBase = useMemo(() => {
    if (!checkoutBooking) return 0;
    const dbTax = Number(checkoutBooking.taxAmount || 0);
    const rawTotal = Number(checkoutBooking.totalAmount || 0);
    const roomsList = Array.isArray(checkoutBooking.rooms) ? checkoutBooking.rooms : [];
    const sumRoomPrices = roomsList.reduce((sum: number, r: any) => sum + (Number(r.price) || 0), 0);

    if (dbTax > 0) {
      return Math.max(0, Number((rawTotal - dbTax).toFixed(2)));
    } else if (sumRoomPrices > 0 && Math.abs(sumRoomPrices - rawTotal) < 1) {
      return sumRoomPrices;
    } else if (rawTotal > 0) {
      return Number((rawTotal / 1.05).toFixed(2));
    }
    return 0;
  }, [checkoutBooking]);

  const roomCheckoutTotal = useMemo(() => {
    return Number((roomCheckoutBase + roomCheckoutTax).toFixed(2));
  }, [roomCheckoutBase, roomCheckoutTax]);

  const roomCheckoutDiscountAmount = useMemo(() => {
    if (!roomCheckoutDiscountValue || roomCheckoutBase <= 0) return 0;
    if (roomCheckoutDiscountType === 'FLAT') {
      return Math.min(roomCheckoutBase, Number(roomCheckoutDiscountValue));
    } else {
      const pct = Math.min(100, Number(roomCheckoutDiscountValue));
      return Number(((roomCheckoutBase * pct) / 100).toFixed(2));
    }
  }, [roomCheckoutDiscountType, roomCheckoutDiscountValue, roomCheckoutBase]);

  const foodCheckoutBase = useMemo(() => {
    const foodOrdersArr: any[] = Array.isArray(checkoutBooking?.foodOrders) ? checkoutBooking.foodOrders : [];
    let base = foodOrdersArr.reduce((sum, f) => sum + (Number(f.price || 0) * Number(f.quantity || 0)), 0);
    const foodTotal = Number(checkoutBooking?.foodTotalAmount || 0);
    if (base === 0 && foodTotal > 0) {
      base = foodTotal / 1.05;
    }
    return base;
  }, [checkoutBooking]);

  const foodCheckoutDiscountAmount = useMemo(() => {
    if (!foodCheckoutDiscountValue || foodCheckoutBase <= 0) return 0;
    if (foodCheckoutDiscountType === 'FLAT') {
      return Math.min(foodCheckoutBase, Number(foodCheckoutDiscountValue));
    } else {
      const pct = Math.min(100, Number(foodCheckoutDiscountValue));
      return Number(((foodCheckoutBase * pct) / 100).toFixed(2));
    }
  }, [foodCheckoutDiscountType, foodCheckoutDiscountValue, foodCheckoutBase]);

  const refreshRoomTypes = async () => {
    try {
      const data = await getRoomTypes();
      setRoomTypes(data.filter(rt => rt.isActive));
      return true;
    } catch (e) {
      console.error('Failed to fetch latest room types:', e);
      setFormError('Failed to fetch latest room availability.');
      return false;
    }
  };

  const handleSearchBookings = async (
    phone = searchPhone, 
    page = currentPage, 
    status = bookingStatusFilter, 
    date = searchDate
  ) => {
    setSearchingBookings(true);
    try {
      const params: any = { page, limit: 9 };
      if (phone?.trim()) params.phone = phone.trim();
      if (status && status !== 'ALL') params.status = status;
      if (date) params.date = date;

      const res = await getBookings(params);
      const bookingsList = Array.isArray(res) 
        ? res 
        : Array.isArray(res?.data) 
        ? res.data 
        : Array.isArray(res?.bookings) 
        ? res.bookings 
        : [];
      const totalP = res?.meta?.totalPages || res?.totalPages || 1;
      const totalB = res?.meta?.total ?? res?.total ?? bookingsList.length;

      setManagedBookings(bookingsList);
      setTotalPages(totalP);
      setTotalBookings(totalB);
    } catch (error) {
      console.error('Failed to search bookings:', error);
      setManagedBookings([]);
      setTotalPages(1);
      setTotalBookings(0);
    } finally {
      setSearchingBookings(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'manage') {
      handleSearchBookings(searchPhone, currentPage, bookingStatusFilter, searchDate);
    }
  }, [activeTab, currentPage, bookingStatusFilter, searchDate]);

  const openAssignmentModal = async (booking: any, mode: 'checkin' | 'edit') => {
    setOpeningModalBookingId(booking.id);
    try {
      if (!(await refreshRoomTypes())) return;

      setModalMode(mode);
      setSelectedBookingId(booking.id);
      const initialAssignments = (booking.rooms || []).map((r: any, i: number) => ({
        id: i,
        roomCode: r.roomCode,
        roomNumber: r.roomNumber || ''
      }));
      setAssignments(initialAssignments);
      setIsModalOpen(true);
    } finally {
      setOpeningModalBookingId(null);
    }
  };

  const handleConfirmCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (assignments.some(a => !a.roomNumber)) {
      setFormError("Please assign a physical room number for all booked rooms.");
      return;
    }

    setSubmitting(true);
    try {
      await checkInBooking(selectedBookingId!, assignments);
      setFormSuccess("Checked in successfully!");
      setIsModalOpen(false);
      handleSearchBookings(); // refresh
    } catch (error: any) {
      setFormError(error.response?.data?.message || 'Failed to check in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmEditRooms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (assignments.some(a => !a.roomNumber)) {
      setFormError("Please assign a physical room number for all booked rooms.");
      return;
    }

    setSubmitting(true);
    try {
      await editBookingRooms(selectedBookingId!, assignments);
      setFormSuccess("Rooms updated successfully!");
      setIsModalOpen(false);
      handleSearchBookings(); // refresh
    } catch (error: any) {
      setFormError(error.response?.data?.message || 'Failed to update rooms. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckoutSubmit = async () => {
    setSubmitting(true);
    try {
      await checkOutBooking(checkoutBooking.id, roomCheckoutDiscountAmount, foodCheckoutDiscountAmount, checkoutPaymentMode);
      setFormSuccess('Booking checked out successfully');
      setCheckoutBooking(null);
      handleSearchBookings();
    } catch (error: any) {
      setFormError(error.response?.data?.message || 'Failed to check out. Please try again.');
      setSearchingBookings(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelingBooking) return;
    setSearchingBookings(true);
    try {
      await cancelBooking(cancelingBooking.id);
      setFormSuccess("Booking cancelled successfully!");
      handleSearchBookings();
      setCancelingBooking(null);
    } catch (error: any) {
      setFormError(error.response?.data?.message || 'Failed to cancel booking. Please try again.');
      setSearchingBookings(false);
    }
  };

  const handleExtendCheckout = async () => {
    if (!extendBookingId || !newCheckOutDate) return;
    setExtendingCheckout(true);
    setExtendModalError('');
    try {
      await extendCheckoutBooking(extendBookingId, newCheckOutDate);
      setFormSuccess("Checkout date extended successfully!");
      setExtendBookingModalOpen(false);
      handleSearchBookings();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to extend checkout. Please try again.';
      setExtendModalError(msg);
      setFormError(msg);
    } finally {
      setExtendingCheckout(false);
    }
  };

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const data = await getRoomTypes();
        setRoomTypes(data.filter(rt => rt.isActive));
      } catch (error) {
        console.error('Failed to fetch room types:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoomTypes();
  }, []);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (formData.checkIn && formData.checkOut) {
        const checkInDate = new Date(formData.checkIn);
        const checkOutDate = new Date(formData.checkOut);

        if (checkInDate > checkOutDate) {
          return;
        }

        setCheckingAvail(true);
        try {
          const availData = await getAvailability(formData.checkIn, formData.checkOut);
          setAvailability(availData);
        } catch (error) {
          console.error('Failed to fetch availability:', error);
        } finally {
          setCheckingAvail(false);
        }
      } else {
        setAvailability({});
      }
    };

    // Add a slight debounce
    const timeoutId = setTimeout(() => {
      fetchAvailability();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [formData.checkIn, formData.checkOut]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormError('');
    setFormSuccess('');
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoomChange = (index: number, field: string, value: string | number) => {
    const newRooms = [...rooms];
    newRooms[index] = { ...newRooms[index], [field]: value };
    if (field === 'roomCode') {
      newRooms[index].rateplanCode = '';
      newRooms[index].price = '';
    } else if (field === 'rateplanCode') {
      const selectedType = roomTypes.find(rt => rt.roomCode === newRooms[index].roomCode);
      const plan = (selectedType?.rateplanCodes as any[])?.find(p => p.code === value);
      if (plan && plan.price !== undefined) {
        newRooms[index].price = Number(plan.price);
      }
    }
    setRooms(newRooms);
  };

  const addRoom = () => {
    setRooms([...rooms, { id: Date.now(), roomCode: '', rateplanCode: '', price: '', adults: 1, children: 0 }]);
  };

  const removeRoom = (index: number) => {
    if (rooms.length > 1) {
      const newRooms = [...rooms];
      newRooms.splice(index, 1);
      setRooms(newRooms);
    }
  };

  const handleAssignmentChange = (id: number, roomNumber: string) => {
    setAssignments(assignments.map(a => a.id === id ? { ...a, roomNumber } : a));
  };

  const submitBooking = async () => {
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');
    try {
      const totalAdults = rooms.reduce((sum, room) => sum + Number(room.adults), 0);
      const totalChildren = rooms.reduce((sum, room) => sum + Number(room.children), 0);
      const dailyBaseAmount = rooms.reduce((sum, room) => sum + (Number(room.price) || 0), 0);
      const baseAmount = Number((dailyBaseAmount * nights).toFixed(2));
      const taxAmount = Number((baseAmount * 0.05).toFixed(2));
      const totalAmount = Number((baseAmount + taxAmount).toFixed(2));

      const payload: BookingPayload = {
        ...formData,
        totalAdults,
        totalChildren,
        baseAmount,
        taxAmount,
        totalAmount,
        rooms: rooms.map(r => ({
          roomCode: r.roomCode,
          rateplanCode: r.rateplanCode,
          price: r.price !== '' ? Number(r.price) : undefined,
          adults: Number(r.adults),
          children: Number(r.children),
          roomNumber: null
        }))
      };

      await createBooking(payload);
      setFormSuccess('Booking Confirmed! The reservation has been successfully created.');
      resetForm();
    } catch (error: any) {
      console.error('Booking failed:', error);
      setFormError(error.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting || loading || checkingAvail) return;

    if (!formData.checkIn || !formData.checkOut) {
      setFormError("Please select check-in and check-out dates.");
      return;
    }

    if (new Date(formData.checkIn) > new Date(formData.checkOut)) {
      setFormError("Check-out date must be same or after check-in date.");
      return;
    }

    // Validate if they booked more rooms of a type than available
    const requestedCounts: Record<string, number> = {};
    rooms.forEach(r => { requestedCounts[r.roomCode] = (requestedCounts[r.roomCode] || 0) + 1 });

    for (const [code, count] of Object.entries(requestedCounts)) {
      const avail = availability[code] || 0;
      if (count > avail) {
        const rtName = roomTypes.find(rt => rt.roomCode === code)?.name || code;
        setFormError(`You requested ${count} room(s) of type ${rtName}, but only ${avail} are available for these dates.`);
        return;
      }
    }

    submitBooking();
  };

  const resetForm = () => {
    setFormData({ guestName: '', guestEmail: '', guestPhone: '', checkIn: '', checkOut: '', specialRequests: '' });
    setRooms([{ id: Date.now(), roomCode: '', rateplanCode: '', price: '', adults: 1, children: 0 }]);
    setAssignments([]);
    setAvailability({});
    setIsModalOpen(false);
  };

  const inputClass = "w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 hover:border-white/20 text-sm";
  const labelClass = "block text-xs font-semibold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider";

  const todayStr = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD' in local time

  return (
    <div className="w-full space-y-6 pb-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Book Room</h1>
          <p className="text-slate-400 mt-1 text-sm">Create a new direct reservation or manage existing</p>
        </div>
        <div className="flex bg-black/20 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('book')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'book' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Create Booking
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'manage' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Manage Bookings
          </button>
        </div>
      </div>

      <AnimatePresence>
        {formError && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3">
            <AlertCircle size={18} />
            <p className="text-sm font-medium">{formError}</p>
          </motion.div>
        )}
        {formSuccess && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-3">
            <CheckCircle2 size={18} />
            <p className="text-sm font-medium">{formSuccess}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeTab === 'book' ? (
          <motion.form key="book" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleContinue} className="space-y-6">

            {/* Card 1: Guest Information */}
            <div className="bg-surface border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <User size={18} className="text-blue-400" /> Guest Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <div className="relative group">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input type="text" name="guestName" required value={formData.guestName} onChange={handleChange} className={`${inputClass} pl-10`} placeholder="Enter guest's full name" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <div className="relative group">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input type="tel" name="guestPhone" required value={formData.guestPhone} onChange={handleChange} className={`${inputClass} pl-10`} placeholder="555-000-0000" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email Address</label>
                  <div className="relative group">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input type="email" name="guestEmail" value={formData.guestEmail} onChange={handleChange} className={`${inputClass} pl-10`} placeholder="guest@example.com" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Stay Details */}
            <div className="bg-surface border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Calendar size={18} className="text-purple-400" /> Stay Details
                </h2>
                {checkingAvail && (
                  <span className="text-xs text-primary flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    <Loader2 size={12} className="animate-spin" /> Checking dates...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Check-in Date</label>
                  <input type="date" name="checkIn" required min={todayStr} value={formData.checkIn} onChange={handleChange} className={`${inputClass} [color-scheme:dark]`} />
                </div>
                <div>
                  <label className={labelClass}>Check-out Date</label>
                  <input type="date" name="checkOut" required min={formData.checkIn || todayStr} value={formData.checkOut} onChange={handleChange} className={`${inputClass} [color-scheme:dark]`} />
                  {formData.checkOut && (
                    <div className="mt-2 text-xs text-slate-400 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-500" />
                        <span>Estimated checkout: <strong>{new Date(formData.checkOut).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at 11:00 AM</strong></span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-extrabold text-[11px] border border-purple-500/30">
                        {nights} {nights === 1 ? 'Night' : 'Nights'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: Room Allocation */}
            <div className="bg-surface border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Bed size={18} className="text-emerald-400" /> Room Allocation
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-lg border border-emerald-500/20">
                    {rooms.length} {rooms.length === 1 ? 'Room' : 'Rooms'}
                  </span>
                  {rooms.some(r => Number(r.price) > 0) && (
                    <span className="bg-emerald-500/20 text-emerald-300 text-xs font-mono font-extrabold px-3 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                      <span>Total: ₹{(rooms.reduce((sum, r) => sum + (Number(r.price) || 0), 0) * nights).toFixed(0)}</span>
                      {nights > 1 && <span className="text-[10px] text-emerald-400 font-normal">({nights} nights)</span>}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-3 bg-black/10 rounded-xl border border-white/5">
                    <Loader2 className="animate-spin text-primary" size={24} />
                    <p className="text-sm">Loading available inventory...</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {rooms.map((room, index) => {
                      const selectedRoomType = roomTypes.find(rt => rt.roomCode === room.roomCode);
                      const ratePlans = selectedRoomType?.rateplanCodes || [];
                      const availCount = room.roomCode && typeof availability[room.roomCode] === 'number' ? availability[room.roomCode] : null;

                      // Validation: are there enough rooms for this type?
                      const requestedOfType = rooms.filter(r => r.roomCode === room.roomCode).length;
                      const isOverbooked = availCount !== null && requestedOfType > availCount;

                      return (
                        <motion.div
                          key={room.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0, margin: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className={`bg-black/20 border rounded-xl p-5 relative group transition-colors ${isOverbooked ? 'border-red-500/50 bg-red-500/5' : 'border-white/5 hover:border-white/10'}`}>
                            {rooms.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeRoom(index)}
                                className="absolute top-4 right-4 text-slate-500 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors z-10"
                                title="Remove Room"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}

                            <div className="flex items-center gap-3 mb-4">
                              <h3 className="text-white font-medium text-sm">
                                Room {index + 1} Configuration
                              </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                              {/* Room Type */}
                              <div className="md:col-span-4">
                                <div className="h-5 flex items-center mb-1.5 ml-0.5">
                                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Room Type</label>
                                </div>
                                <div className="relative group">
                                  <Bed size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
                                  <select
                                    required
                                    value={room.roomCode}
                                    onChange={(e) => handleRoomChange(index, 'roomCode', e.target.value)}
                                    className={`${inputClass} pl-10 bg-black/40 text-xs sm:text-sm`}
                                  >
                                    <option value="" disabled>Select a type...</option>
                                    {roomTypes.map((type) => {
                                      const availForType = availability[type.roomCode];
                                      const availText = checkingAvail
                                        ? ' - Checking...'
                                        : (typeof availForType === 'number' ? ` - ${availForType} avail.` : '');
                                      return (
                                        <option key={type.id} value={type.roomCode}>
                                          {type.name}{availText}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                              </div>

                              {/* Rate Plan */}
                              <div className="md:col-span-3">
                                <div className="h-5 flex items-center mb-1.5 ml-0.5">
                                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Rate Plan</label>
                                </div>
                                <div className="relative group">
                                  <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
                                  <select
                                    required
                                    value={room.rateplanCode}
                                    onChange={(e) => handleRoomChange(index, 'rateplanCode', e.target.value)}
                                    className={`${inputClass} pl-10 bg-black/40 disabled:opacity-50 text-xs sm:text-sm`}
                                    disabled={!room.roomCode || ratePlans.length === 0}
                                  >
                                    <option value="" disabled>Select rate plan...</option>
                                    {ratePlans.map((plan: any) => (
                                      <option key={plan.code} value={plan.code}>
                                        {plan.code} - ₹{plan.price}/night
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* Price / Night */}
                              <div className="md:col-span-2">
                                <div className="h-5 flex items-center justify-between mb-1.5 ml-0.5">
                                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Price / Night</label>
                                  <span className="text-[10px] text-emerald-400 font-medium lowercase">editable</span>
                                </div>
                                <div className="relative group">
                                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-xs pointer-events-none">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    required
                                    placeholder="0"
                                    value={room.price ?? ''}
                                    onChange={(e) => handleRoomChange(index, 'price', e.target.value === '' ? '' : Number(e.target.value))}
                                    className={`${inputClass} pl-8 font-mono font-bold text-emerald-400 bg-black/40 text-xs sm:text-sm`}
                                  />
                                </div>
                              </div>

                              {/* Adults & Children */}
                              <div className="md:col-span-3 grid grid-cols-2 gap-2">
                                <div>
                                  <div className="h-5 flex items-center mb-1.5 ml-0.5">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Adults</label>
                                  </div>
                                  <div className="relative group">
                                    <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors pointer-events-none" />
                                    <input
                                      type="number"
                                      min="1"
                                      required
                                      value={room.adults}
                                      onChange={(e) => handleRoomChange(index, 'adults', parseInt(e.target.value) || 1)}
                                      className={`${inputClass} pl-8 bg-black/40 text-xs sm:text-sm`}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <div className="h-5 flex items-center mb-1.5 ml-0.5">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Children</label>
                                  </div>
                                  <div className="relative group">
                                    <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors pointer-events-none" />
                                    <input
                                      type="number"
                                      min="0"
                                      required
                                      value={room.children}
                                      onChange={(e) => handleRoomChange(index, 'children', parseInt(e.target.value) || 0)}
                                      className={`${inputClass} pl-8 bg-black/40 text-xs sm:text-sm`}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                )}

                {!loading && (
                  <button
                    type="button"
                    onClick={addRoom}
                    className="w-full py-4 rounded-xl border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-2 font-medium text-sm mt-2"
                  >
                    <Plus size={16} className="text-emerald-400" />
                    Add Another Room
                  </button>
                )}
              </div>

              <div className="mt-6 border-t border-white/10 pt-6">
                <label className={labelClass}>Special Requests (Optional)</label>
                <div className="relative group">
                  <AlignLeft size={16} className="absolute left-4 top-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                  <textarea
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleChange}
                    rows={3}
                    className={`${inputClass} pl-10 resize-none`}
                    placeholder="Any preferences or special requests..."
                  ></textarea>
                </div>
              </div>

              {/* Room Price Summary & Tax Breakdown */}
              {(() => {
                const totalDailyPrice = rooms.reduce((sum, r) => sum + (Number(r.price) || 0), 0);
                const formBaseAmount = Number((totalDailyPrice * nights).toFixed(2));
                const formTaxAmount = Number((formBaseAmount * 0.05).toFixed(2));
                const formTotalAmount = Number((formBaseAmount + formTaxAmount).toFixed(2));

                if (totalDailyPrice <= 0) return null;

                return (
                  <div className="mt-6 p-4.5 rounded-2xl bg-gradient-to-r from-violet-500/10 via-primary/5 to-transparent border border-primary/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1.5">
                      <div className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <Tag size={14} className="text-primary" /> Room Price Summary
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-bold">
                          {nights} {nights === 1 ? 'Night' : 'Nights'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 sm:gap-3 flex-wrap">
                        {nights > 1 && (
                          <>
                            <span>Daily Rate: <strong className="text-slate-300 font-mono font-bold">₹{totalDailyPrice.toFixed(2)}/night</strong></span>
                            <span>&bull;</span>
                          </>
                        )}
                        <span>Base Amount ({nights}N): <strong className="text-slate-200 font-mono font-bold">₹{formBaseAmount.toFixed(2)}</strong></span>
                        <span>&bull;</span>
                        <span>GST (5%): <strong className="text-emerald-400 font-mono font-bold">+₹{formTaxAmount.toFixed(2)}</strong></span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Total Amount (inc. 5% Tax)</span>
                      <span className="text-2xl font-mono font-black text-emerald-400">₹{formTotalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Action Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={16} /> Reset
              </button>
              <button
                type="submit"
                disabled={loading || checkingAvail || submitting}
                className={`px-8 py-3 rounded-xl flex items-center justify-center gap-2 text-white font-bold transition-all text-sm ${(loading || checkingAvail || submitting) ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 hover:-translate-y-0.5'}`}
              >
                {(checkingAvail || submitting) ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                {submitting ? 'Creating Booking...' : checkingAvail ? 'Checking Availability...' : 'Continue to Assignment'}
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div key="manage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {/* Search Bar Section */}
            <div className="bg-surface border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Search size={18} className="text-primary" /> Search Reservations
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Find active or past bookings by guest phone number or check-in date</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-5 relative">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Phone size={13} className="text-primary" /> Guest Phone
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel"
                      value={searchPhone}
                      onChange={e => setSearchPhone(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (() => { setCurrentPage(1); handleSearchBookings(searchPhone, 1, bookingStatusFilter, searchDate); })()}
                      placeholder="Enter phone number..."
                      className="w-full bg-black/40 text-white border border-white/10 rounded-xl outline-none text-sm placeholder-slate-500 pl-10 pr-4 py-2.5 focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>
                <div className="sm:col-span-4 relative">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Calendar size={13} className="text-primary" /> Check-In Date
                  </label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="date"
                      value={searchDate}
                      onChange={e => {
                        setSearchDate(e.target.value);
                        setCurrentPage(1);
                        handleSearchBookings(searchPhone, 1, bookingStatusFilter, e.target.value);
                      }}
                      className="w-full bg-black/40 text-white border border-white/10 rounded-xl outline-none text-sm pl-10 pr-8 py-2.5 focus:border-primary/50 transition-colors"
                      style={{ colorScheme: 'dark' }}
                    />
                    {searchDate && (
                      <button
                        onClick={() => {
                          setSearchDate('');
                          setCurrentPage(1);
                          handleSearchBookings(searchPhone, 1, bookingStatusFilter, '');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <button
                    onClick={() => { setCurrentPage(1); handleSearchBookings(searchPhone, 1, bookingStatusFilter, searchDate); }}
                    disabled={searchingBookings}
                    className="w-full bg-primary hover:bg-primary-hover py-2.5 rounded-xl text-white font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:-translate-y-0.5"
                  >
                    {searchingBookings ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    <span>{searchingBookings ? 'Searching...' : 'Search'}</span>
                  </button>
                </div>
              </div>

              {/* Status Filter Bar */}
              <div className="pt-4 border-t border-white/5 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Filter View
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap">
                  {['ALL', 'RESERVED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'].map((status) => {
                    const isActive = bookingStatusFilter === status;
                    const labels: any = {
                      'ALL': 'All Bookings',
                      'RESERVED': 'Reserved',
                      'CHECKED_IN': 'Checked In',
                      'CHECKED_OUT': 'Checked Out',
                      'CANCELLED': 'Cancelled',
                    };
                    
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => { setBookingStatusFilter(status as any); setCurrentPage(1); }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border whitespace-nowrap ${
                          isActive
                            ? 'bg-primary/20 text-primary border-primary/40 shadow-sm'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {isActive && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                        {labels[status]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bookings List */}
            <div className="space-y-4">
              {searchingBookings ? (
                <div className="text-center py-14 px-4 text-slate-400 bg-surface/40 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <span className="text-sm font-medium text-slate-300">Searching bookings...</span>
                </div>
              ) : (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {managedBookings.map(b => {
                    const isPaid = b.paymentStatus === 'PAID';
                    
                    const finalTotal = Math.max(0, 
                      Number(b.totalAmount || 0) 
                      + Number(b.foodTotalAmount || 0) 
                      - Number(b.roomDiscountAmount || 0) 
                      - Number(b.foodDiscountAmount || 0)
                    );

                    return (
                      <div key={b.id} className="bg-[#15171e]/90 hover:bg-[#181a22] border border-white/10 hover:border-primary/40 rounded-3xl p-4 sm:p-5 shadow-2xl transition-all duration-300 space-y-4 relative overflow-hidden group backdrop-blur-xl flex flex-col justify-between">
                        {/* Top subtle glow line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="space-y-4">
                          {/* Top Row: Guest Info & Status Badge */}
                          <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/10">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600/40 to-indigo-600/40 border border-violet-500/50 text-violet-200 font-black text-sm flex items-center justify-center shadow-lg shadow-violet-500/10 shrink-0">
                                {(b.guestName || 'G').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-extrabold text-white tracking-tight truncate">
                                    {b.guestName || 'Guest'}
                                  </h3>
                                  {(b.status === 'RESERVED' || b.status === 'CHECKED_IN') && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingGuestBooking(b)}
                                      className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-violet-600/30 active:scale-95 text-slate-200 hover:text-white border border-white/20 hover:border-violet-400/60 text-[10px] font-bold flex items-center gap-1 transition-all shadow-sm shrink-0 cursor-pointer"
                                      title="Edit Guest Name & Phone"
                                    >
                                      <Edit2 size={10} className="text-violet-400" />
                                      <span>Edit</span>
                                    </button>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-300 font-medium flex items-center gap-1.5 mt-0.5 truncate">
                                  <Phone size={12} className="text-emerald-400 shrink-0" /> {b.guestPhone}
                                </p>
                              </div>
                            </div>

                            {/* Status Badges */}
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold tracking-wide border flex items-center gap-1.5 shrink-0 shadow-sm ${
                              b.status === 'CHECKED_IN'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10'
                                : b.status === 'RESERVED'
                                  ? 'bg-sky-500/15 text-sky-400 border-sky-500/30 shadow-sky-500/10'
                                  : b.status === 'CHECKED_OUT'
                                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                b.status === 'CHECKED_IN'
                                  ? 'bg-emerald-400 animate-pulse'
                                  : b.status === 'RESERVED'
                                    ? 'bg-sky-400'
                                    : b.status === 'CHECKED_OUT'
                                      ? 'bg-indigo-400'
                                      : 'bg-rose-400'
                              }`} />
                              {b.status.replace('_', ' ')}
                            </span>
                          </div>

                          {/* Middle Details Grid (2x2) */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white/[0.03] hover:bg-white/[0.06] p-2.5 rounded-xl border border-white/10 transition-all duration-200">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                                <Calendar size={12} className="text-emerald-400" /> Check In
                              </div>
                              <div className="font-extrabold text-white text-xs tracking-tight">
                                {new Date(b.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                            </div>

                            <div className="bg-white/[0.03] hover:bg-white/[0.06] p-2.5 rounded-xl border border-white/10 transition-all duration-200">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                                <Calendar size={12} className="text-rose-400" /> Check Out
                              </div>
                              <div className="font-extrabold text-white text-xs tracking-tight">
                                {new Date(b.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                            </div>

                            <div className="bg-white/[0.03] hover:bg-white/[0.06] p-2.5 rounded-xl border border-white/10 transition-all duration-200">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                                <Users size={12} className="text-indigo-400" /> Guests
                              </div>
                              <div className="font-extrabold text-white text-xs tracking-tight truncate">
                                {b.totalAdults || 1} Adult{(b.totalAdults || 1) > 1 ? 's' : ''}
                                {Number(b.totalChildren) > 0 ? `, ${b.totalChildren} C` : ''}
                              </div>
                            </div>

                            <div className="bg-white/[0.03] hover:bg-white/[0.06] p-2.5 rounded-xl border border-white/10 transition-all duration-200">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                                <CreditCard size={12} className="text-amber-400" /> Payment
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-white font-mono font-black text-xs">₹{finalTotal.toFixed(0)}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase tracking-wide border ${
                                  isPaid
                                    ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                                    : 'text-amber-400 bg-amber-500/15 border-amber-500/30'
                                }`}>
                                  {b.paymentStatus}
                                </span>
                                {b.paymentMode && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-white/10 text-slate-300 border border-white/15">
                                    {b.paymentMode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Rooms Breakdown */}
                          {Array.isArray(b.rooms) && b.rooms.length > 0 && (
                            <div className="bg-black/40 border border-white/10 rounded-xl p-3 space-y-2 backdrop-blur-sm">
                              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
                                <span className={`flex items-center gap-1.5 ${
                                  b.status === 'CHECKED_IN'
                                    ? 'text-emerald-400'
                                    : b.status === 'RESERVED'
                                      ? 'text-sky-400'
                                      : 'text-indigo-300'
                                }`}>
                                  <Bed size={14} /> 
                                  {b.status === 'CHECKED_IN'
                                    ? 'Checked-In Rooms'
                                    : b.status === 'RESERVED'
                                      ? 'Reserved Rooms'
                                      : 'Allocated Rooms'} ({b.rooms.length})
                                </span>
                              </div>
                              <div className="space-y-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                                {b.rooms.map((r: any, idx: number) => (
                                  <div key={idx} className="bg-gradient-to-r from-[#1c1f28] to-[#171922] border border-white/10 rounded-lg p-2 flex items-center justify-between transition-all duration-200">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center border shrink-0 ${
                                        r.roomNumber
                                          ? b.status === 'CHECKED_IN'
                                            ? 'bg-gradient-to-br from-emerald-500/30 to-teal-600/30 text-emerald-300 border-emerald-500/40'
                                            : 'bg-gradient-to-br from-sky-500/30 to-blue-600/30 text-sky-300 border-sky-500/40'
                                          : 'bg-slate-800/60 text-slate-400 border-slate-700'
                                      }`}>
                                        {r.roomNumber || `#${idx + 1}`}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-bold text-white text-xs tracking-tight truncate">
                                          {r.roomNumber ? `Room ${r.roomNumber}` : 'Unassigned'}
                                        </div>
                                        <div className="text-[9px] text-slate-400 flex items-center gap-1 truncate">
                                          Code: <span className="font-mono font-semibold text-slate-300 bg-white/5 border border-white/10 px-1 py-0.2 rounded">{r.roomCode || 'Standard'}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-300 shrink-0">
                                      {r.adults ?? 1}A{Number(r.children) > 0 ? `, ${r.children}C` : ''}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bottom Action Bar */}
                        <div className="pt-3 border-t border-white/5 mt-2">
                          {b.status === 'RESERVED' && (
                            <div className="grid grid-cols-2 gap-2 w-full">
                              <button
                                type="button"
                                onClick={() => setCancelingBooking(b)}
                                disabled={searchingBookings || openingModalBookingId === b.id}
                                className="h-10 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:scale-[0.98] text-rose-400 border border-rose-500/25 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                <X size={14} className="shrink-0" />
                                <span>Cancel</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openAssignmentModal(b, 'checkin')}
                                disabled={searchingBookings || openingModalBookingId === b.id}
                                className="h-10 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] text-white font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                {openingModalBookingId === b.id ? (
                                  <Loader2 size={14} className="animate-spin shrink-0" />
                                ) : (
                                  <Key size={14} className="shrink-0" />
                                )}
                                <span className="truncate">{openingModalBookingId === b.id ? 'Opening...' : 'Check In'}</span>
                              </button>
                            </div>
                          )}

                          {b.status === 'CHECKED_IN' && (
                            <div className="grid grid-cols-2 gap-2 w-full">
                              <button
                                type="button"
                                onClick={() => openAssignmentModal(b, 'edit')}
                                disabled={searchingBookings || openingModalBookingId === b.id}
                                className="h-10 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 active:scale-[0.98] text-blue-400 border border-blue-500/25 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                              >
                                {openingModalBookingId === b.id ? (
                                  <Loader2 size={14} className="animate-spin shrink-0" />
                                ) : (
                                  <Bed size={14} className="shrink-0" />
                                )}
                                <span>Change Room</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setExtendBookingId(b.id);
                                  setExtendBookingCurrentCheckOut(b.checkOut);
                                  setExtendModalError('');
                                  
                                  const d = new Date(b.checkOut);
                                  d.setDate(d.getDate() + 1);
                                  setNewCheckOutDate(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
                                  setExtendBookingModalOpen(true);
                                }}
                                disabled={searchingBookings || openingModalBookingId === b.id}
                                className="h-10 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 active:scale-[0.98] text-purple-400 border border-purple-500/25 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                              >
                                <Calendar size={14} className="shrink-0" />
                                <span>Extend Stay</span>
                              </button>

                              {!isPaid && (
                                <button
                                  type="button"
                                  onClick={() => setPaymentModalBooking(b)}
                                  disabled={searchingBookings || openingModalBookingId === b.id}
                                  className="col-span-2 h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 active:scale-[0.98] text-emerald-300 border border-emerald-500/40 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/15 cursor-pointer disabled:opacity-50"
                                >
                                  <CreditCard size={15} className="shrink-0 text-emerald-400" />
                                  <span>Update Payment (Pending)</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setCheckoutBooking(b);
                                  setCheckoutPaymentMode(b.paymentMode || 'CASH');
                                  setRoomCheckoutDiscountType('FLAT');
                                  setRoomCheckoutDiscountValue('');
                                  setFoodCheckoutDiscountType('FLAT');
                                  setFoodCheckoutDiscountValue('');
                                }}
                                disabled={searchingBookings || openingModalBookingId === b.id || !isPaid}
                                className={`col-span-2 h-10 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm border ${
                                  isPaid 
                                    ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 active:scale-[0.98] text-amber-300 border-amber-500/30 shadow-amber-500/10 cursor-pointer' 
                                    : 'bg-white/5 text-slate-500 border-white/10 cursor-not-allowed'
                                }`}
                                title={!isPaid ? 'Payment must be completed before check-out' : ''}
                              >
                                <CheckCircle size={15} className="shrink-0" />
                                <span>Check Out</span>
                              </button>
                            </div>
                          )}

                          {b.status === 'CHECKED_OUT' && (
                            <button
                              type="button"
                              onClick={() => setPrintBillModalData({ booking: b })}
                              className="w-full h-10 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.98] text-emerald-400 border border-emerald-500/25 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                              <Printer size={15} /> Print Bill
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                  {managedBookings.length === 0 && !searchingBookings && (
                    <div className="text-center py-14 px-4 text-slate-400 bg-surface/40 border border-white/5 rounded-2xl space-y-2">
                      <Search size={32} className="mx-auto text-slate-600 mb-2" />
                      <div className="text-slate-300 font-semibold">No Bookings Found</div>
                      <div className="text-xs text-slate-500 max-w-sm mx-auto">
                        Enter a guest phone number above to search and manage room assignments, check-ins, or check-outs.
                      </div>
                    </div>
                  )}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5">
                      <div className="text-xs text-slate-400 font-medium bg-surface/60 border border-white/10 px-3.5 py-2 rounded-xl backdrop-blur-md">
                        Showing <span className="text-white font-bold">{managedBookings.length}</span> of <span className="text-white font-bold">{totalBookings}</span> bookings
                      </div>

                      {/* Center Page Number Buttons */}
                      <div className="flex items-center gap-1.5 bg-surface/60 border border-white/10 p-1.5 rounded-2xl backdrop-blur-md shadow-lg">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1 || searchingBookings}
                          className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 font-medium text-xs transition-all flex items-center gap-1"
                        >
                          <ChevronLeft size={14} /> Prev
                        </button>

                        <div className="flex items-center gap-1 px-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                            .map((p, idx, arr) => {
                              const prev = arr[idx - 1];
                              const showEllipsis = prev && p - prev > 1;

                              return (
                                <React.Fragment key={p}>
                                  {showEllipsis && <span className="text-slate-600 px-1 text-xs">...</span>}
                                  <button
                                    onClick={() => setCurrentPage(p)}
                                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                                      currentPage === p
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                  >
                                    {p}
                                  </button>
                                </React.Fragment>
                              );
                            })}
                        </div>

                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages || searchingBookings}
                          className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 font-medium text-xs transition-all flex items-center gap-1"
                        >
                          Next <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Room Assignment Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-lg p-6 sm:p-7 bg-[#16181d] border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden"
              initial={{ scale: 0.95, opacity: 0, y: 15 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 15 }}
            >
              {/* Accent Bar */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-75"></div>

              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <Bed size={18} />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {modalMode === 'checkin' ? 'Assign Rooms & Check-In' : 'Change Room Allocation'}
                    </h2>
                  </div>
                  <p className="text-slate-400 text-xs ml-9">
                    Select physical room numbers for each reserved room type.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={modalMode === 'checkin' ? handleConfirmCheckIn : handleConfirmEditRooms} className="space-y-4">
                <div className="space-y-3.5 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
                  {assignments.map((assignment, index) => {
                    const roomType = roomTypes.find(rt => rt.roomCode === assignment.roomCode);
                    const availableRooms = (roomType?.rooms as any[])?.filter((r: any) => r.status === 'no status' || (modalMode === 'edit' && r.userRoomBookingId === selectedBookingId)) || [];

                    return (
                      <div key={assignment.id} className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-2.5 transition-all hover:border-white/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="text-white font-semibold text-xs">Room Slot #{index + 1}</span>
                          </div>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                            {roomType?.name || assignment.roomCode}
                          </span>
                        </div>

                        <div className="relative group">
                          <Bed size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors z-10" />
                          <select
                            required
                            value={assignment.roomNumber}
                            onChange={(e) => handleAssignmentChange(assignment.id, e.target.value)}
                            className={`${inputClass} appearance-none pl-10 bg-black/40 py-3 text-sm font-semibold rounded-xl text-white border-white/10`}
                          >
                            <option value="" disabled>Select Room Number...</option>
                            {availableRooms.map((r: any) => {
                              const isSelectedElsewhere = assignments.some(a => a.id !== assignment.id && a.roomCode === assignment.roomCode && a.roomNumber === r.roomNumber);
                              return (
                                <option key={r.roomNumber} value={r.roomNumber} disabled={isSelectedElsewhere}>
                                  Room {r.roomNumber} {isSelectedElsewhere ? '(Selected in another slot)' : ''}
                                </option>
                              );
                            })}
                          </select>
                          {availableRooms.length === 0 && (
                            <p className="text-red-400 text-xs mt-2 bg-red-500/10 p-2 rounded.xl border border-red-500/20 flex items-center gap-1.5">
                              <AlertCircle size={14} /> No rooms available for this room type.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-6 py-2.5 rounded-xl flex items-center gap-2 text-white font-bold transition-all text-sm ${submitting ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 hover:shadow-primary/30'}`}
                  >
                    {submitting ? <Loader2 className="animate-spin" size={16} /> : <Key size={16} />}
                    <span>{submitting ? 'Saving Changes...' : modalMode === 'checkin' ? 'Confirm Check-In' : 'Save Room Allocation'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {checkoutBooking && (
          <motion.div
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-lg p-6 sm:p-7 bg-[#16181d] border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden"
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
            >
              {/* Accent Line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-75"></div>

              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CreditCard size={18} />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Checkout Summary</h2>
                  </div>
                  <p className="text-slate-400 text-xs ml-9">
                    {checkoutBooking.guestName || 'Guest'} &bull; {checkoutBooking.guestPhone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutBooking(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Bill Details Breakdown */}
              <div className="space-y-4 mb-6">
                <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3">
                  {/* Room Bill Row */}
                  <div className="flex justify-between items-start text-sm">
                    <span className="text-slate-300 font-medium flex items-center gap-2 mt-1">
                      <Bed size={15} className="text-slate-400" /> Room Bill
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                        checkoutBooking.paymentStatus === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {checkoutBooking.paymentStatus}
                      </span>
                      <span className="text-white font-bold font-mono">₹{roomCheckoutTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {roomCheckoutTotal > 0 && (
                    <div className="bg-white/5 rounded-xl p-2.5 text-xs space-y-1 text-slate-400">
                      <div className="flex justify-between items-center">
                        <span>Base Amount:</span>
                        <span className="text-slate-200 font-mono">₹{roomCheckoutBase.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>GST (5%):</span>
                        <span className="text-slate-200 font-mono">₹{roomCheckoutTax.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Room Discount Controls */}
                  {roomCheckoutBase > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">Room Discount:</span>
                        <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              setRoomCheckoutDiscountType('FLAT');
                              setRoomCheckoutDiscountValue('');
                            }}
                            className={`px-2.5 py-0.5 rounded-md transition-all ${
                              roomCheckoutDiscountType === 'FLAT' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            ₹ Flat
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRoomCheckoutDiscountType('PERCENT');
                              setRoomCheckoutDiscountValue('');
                            }}
                            className={`px-2.5 py-0.5 rounded-md transition-all ${
                              roomCheckoutDiscountType === 'PERCENT' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            % Off
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex items-center">
                          {roomCheckoutDiscountType === 'FLAT' && (
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                          )}
                          <input 
                            type="number" 
                            min="0" 
                            max={roomCheckoutDiscountType === 'PERCENT' ? 100 : roomCheckoutBase}
                            value={roomCheckoutDiscountValue}
                            onChange={(e) => setRoomCheckoutDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="0"
                            className={`bg-white/5 border border-white/10 rounded-xl py-1 text-xs text-white text-right focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono ${
                              roomCheckoutDiscountType === 'FLAT' ? 'pl-6 pr-2.5 w-24' : 'pl-2.5 pr-6 w-20'
                            }`}
                          />
                          {roomCheckoutDiscountType === 'PERCENT' && (
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-400 text-xs font-bold">%</span>
                          )}
                        </div>

                        {roomCheckoutDiscountAmount > 0 && (
                          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            {roomCheckoutDiscountType === 'FLAT'
                              ? `${((roomCheckoutDiscountAmount / roomCheckoutBase) * 100).toFixed(1)}% off`
                              : `-₹${roomCheckoutDiscountAmount.toFixed(2)}`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Restaurant Bill Row & Breakdown */}
                  {(() => {
                    const foodGst = foodCheckoutBase * 0.05;
                    const foodTotalIncTax = foodCheckoutBase + foodGst;

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
                              <span className="text-slate-200 font-mono">₹{foodCheckoutBase.toFixed(2)}</span>
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
                              <span className="text-xs text-slate-400 font-medium">Food Discount:</span>
                              <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10 text-[11px] font-bold">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFoodCheckoutDiscountType('FLAT');
                                    setFoodCheckoutDiscountValue('');
                                  }}
                                  className={`px-2.5 py-0.5 rounded-md transition-all ${
                                    foodCheckoutDiscountType === 'FLAT' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  ₹ Flat
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFoodCheckoutDiscountType('PERCENT');
                                    setFoodCheckoutDiscountValue('');
                                  }}
                                  className={`px-2.5 py-0.5 rounded-md transition-all ${
                                    foodCheckoutDiscountType === 'PERCENT' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  % Off
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="relative flex items-center">
                                {foodCheckoutDiscountType === 'FLAT' && (
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                                )}
                                <input 
                                  type="number" 
                                  min="0" 
                                  max={foodCheckoutDiscountType === 'PERCENT' ? 100 : foodCheckoutBase}
                                  value={foodCheckoutDiscountValue}
                                  onChange={(e) => setFoodCheckoutDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
                                  placeholder="0"
                                  className={`bg-white/5 border border-white/10 rounded-xl py-1 text-xs text-white text-right focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono ${
                                    foodCheckoutDiscountType === 'FLAT' ? 'pl-6 pr-2.5 w-24' : 'pl-2.5 pr-6 w-20'
                                  }`}
                                />
                                {foodCheckoutDiscountType === 'PERCENT' && (
                                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-400 text-xs font-bold">%</span>
                                )}
                              </div>

                              {foodCheckoutDiscountAmount > 0 && (
                                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                  {foodCheckoutDiscountType === 'FLAT'
                                    ? `${((foodCheckoutDiscountAmount / foodCheckoutBase) * 100).toFixed(1)}% off base`
                                    : `-₹${foodCheckoutDiscountAmount.toFixed(2)}`}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Payment Mode Selector in Checkout */}
                  <div className="pt-3 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <CreditCard size={15} className="text-emerald-400" />
                        <span>Payment Mode</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        Select method to finalize bill
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['CASH', 'CARD', 'UPI'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setCheckoutPaymentMode(mode)}
                          className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            checkoutPaymentMode === mode
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                              : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/10 hover:border-white/20'
                          }`}
                        >
                          {mode === 'CASH' && <Banknote size={14} className="text-emerald-400 shrink-0" />}
                          {mode === 'CARD' && <CreditCard size={14} className="text-blue-400 shrink-0" />}
                          {mode === 'UPI' && <Smartphone size={14} className="text-purple-400 shrink-0" />}
                          <span>{mode === 'CASH' ? 'Cash' : mode === 'CARD' ? 'Card / POS' : 'UPI / QR'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Final Total */}
                <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <div className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-0.5">Final Amount Due</div>
                    <div className="text-[11px] text-slate-500">
                      {checkoutBooking.paymentStatus === 'PAID'
                        ? 'Includes Room & Restaurant after discounts'
                        : 'Includes Room + Restaurant - All Discounts'}
                    </div>
                  </div>
                  <div className="text-emerald-400 font-black text-2xl font-mono tracking-tight">
                    ₹{Math.max(0, (
                      Math.max(0, roomCheckoutTotal - roomCheckoutDiscountAmount) +
                      Math.max(0, (foodCheckoutBase + foodCheckoutBase * 0.05) - foodCheckoutDiscountAmount)
                    )).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCheckoutBooking(null)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setPrintBillModalData({
                    booking: checkoutBooking,
                    roomDiscount: roomCheckoutDiscountAmount,
                    foodDiscount: foodCheckoutDiscountAmount
                  })}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all text-sm font-bold whitespace-nowrap"
                >
                  <Printer size={16} /> Print Bill
                </button>
                <button
                  type="button"
                  onClick={handleCheckoutSubmit}
                  disabled={submitting}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all text-sm font-bold shadow-lg shadow-emerald-500/25 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Checking out...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Confirm Checkout</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Booking Modal */}
      <AnimatePresence>
        {cancelingBooking && (
          <motion.div
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-lg p-6 sm:p-7 bg-[#16181d] border border-red-500/20 rounded-3xl shadow-2xl relative overflow-hidden"
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
            >
              {/* Accent Line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-75"></div>

              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Cancel Booking?</h2>
                    <p className="text-slate-400 text-xs mt-0.5">This action cannot be undone.</p>
                  </div>
                </div>
                <button
                  onClick={() => setCancelingBooking(null)}
                  disabled={searchingBookings}
                  className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4 mb-6 text-center">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                  <p className="text-slate-300 text-sm">
                    Are you sure you want to cancel the booking for <strong className="text-white">{cancelingBooking.guestName}</strong>?
                    <br/><br/>
                    Canceling will release the reserved inventory back to the channel manager.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setCancelingBooking(null)}
                  disabled={searchingBookings}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={searchingBookings}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
                >
                  {searchingBookings ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
                  Yes, Cancel It
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extend Checkout Modal */}
      <AnimatePresence>
        {extendBookingModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !extendingCheckout && setExtendBookingModalOpen(false)}
          >
            <motion.div
              className="w-full max-w-md p-6 sm:p-7 bg-[#16181d] border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden"
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Accent Line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-75"></div>

              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Extend Checkout</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Select a new checkout date for this guest.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExtendBookingModalOpen(false)}
                  disabled={extendingCheckout}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4 mb-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Current Checkout Date
                  </label>
                  <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-slate-300 text-sm flex items-center justify-between font-medium">
                    <span>
                      {extendBookingCurrentCheckOut
                        ? `${new Date(extendBookingCurrentCheckOut).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })} at 11:00 AM`
                        : '-'}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                      Current
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    New Checkout Date
                  </label>
                  <div
                    className="relative group cursor-pointer"
                    onClick={(e) => {
                      const input = e.currentTarget.querySelector('input');
                      if (input && typeof (input as any).showPicker === 'function') {
                        try {
                          (input as any).showPicker();
                        } catch (_) {}
                      }
                    }}
                  >
                    <Calendar
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none transition-colors"
                    />
                    <input
                      type="date"
                      min={(() => {
                        if (!extendBookingCurrentCheckOut) return '';
                        const d = new Date(extendBookingCurrentCheckOut);
                        d.setDate(d.getDate() + 1);
                        return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
                      })()}
                      value={newCheckOutDate}
                      onChange={(e) => {
                        setNewCheckOutDate(e.target.value);
                        setExtendModalError('');
                      }}
                      onClick={(e) => {
                        if (typeof (e.currentTarget as any).showPicker === 'function') {
                          try {
                            (e.currentTarget as any).showPicker();
                          } catch (_) {}
                        }
                      }}
                      onFocus={(e) => {
                        if (typeof (e.currentTarget as any).showPicker === 'function') {
                          try {
                            (e.currentTarget as any).showPicker();
                          } catch (_) {}
                        }
                      }}
                      required
                      disabled={extendingCheckout}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                </div>

                {extendModalError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs leading-relaxed"
                  >
                    <AlertCircle size={16} className="shrink-0 text-red-400 mt-0.5" />
                    <div className="flex-1 font-medium">{extendModalError}</div>
                  </motion.div>
                )}

                {newCheckOutDate && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                        <Calendar size={13} className="text-purple-400" /> Expected Checkout:
                      </span>
                      <span className="text-purple-300 font-bold">
                        {new Date(newCheckOutDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at 11:00 AM
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-purple-500/15 text-[11px]">
                      <span className="text-slate-400">Last Night of Stay:</span>
                      <span className="text-slate-300 font-medium">
                        {(() => {
                          const prev = new Date(newCheckOutDate);
                          prev.setDate(prev.getDate() - 1);
                          return prev.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                        })()}
                      </span>
                    </div>
                    {extendBookingCurrentCheckOut && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Extension Duration:</span>
                        <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          +{Math.max(0, Math.round((new Date(newCheckOutDate).getTime() - new Date(extendBookingCurrentCheckOut).getTime()) / (1000 * 60 * 60 * 24)))} Extra {Math.max(0, Math.round((new Date(newCheckOutDate).getTime() - new Date(extendBookingCurrentCheckOut).getTime()) / (1000 * 60 * 60 * 24))) === 1 ? 'Night' : 'Nights'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendBookingModalOpen(false)}
                  disabled={extendingCheckout}
                  className="h-11 px-4 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white text-sm font-semibold transition-all flex items-center justify-center disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExtendCheckout}
                  disabled={extendingCheckout || !newCheckOutDate}
                  className="h-11 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {extendingCheckout ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Extending...</span>
                    </>
                  ) : (
                    <>
                      <Calendar size={16} />
                      <span>Confirm Extension</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <EditGuestModal
        isOpen={!!editingGuestBooking}
        onClose={() => setEditingGuestBooking(null)}
        booking={editingGuestBooking}
        onSuccess={() => {
          setFormSuccess("Guest details updated successfully!");
          handleSearchBookings();
        }}
      />

      <PrintBookingBillModal
        isOpen={!!printBillModalData}
        onClose={() => setPrintBillModalData(null)}
        booking={printBillModalData?.booking}
        roomDiscount={printBillModalData?.roomDiscount}
        foodDiscount={printBillModalData?.foodDiscount}
      />

      <ChangePaymentModal
        isOpen={!!paymentModalBooking}
        onClose={() => setPaymentModalBooking(null)}
        booking={paymentModalBooking}
        onSuccess={(updated) => {
          setFormSuccess("Payment status updated to PAID successfully!");
          if (updated && updated.id) {
            setManagedBookings(prev => prev.map(b => b.id === updated.id ? { ...b, ...updated } : b));
          } else {
            handleSearchBookings();
          }
        }}
      />

    </div>
  );
}
