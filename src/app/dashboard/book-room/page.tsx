'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bed, Calendar, Users, User, Plus, Trash2, Mail, Phone, CreditCard, Loader2, Key, X, RefreshCw, Tag, AlignLeft, AlertCircle, CheckCircle2, Search, CheckCircle, Printer } from 'lucide-react';
import { getRoomTypes, RoomType, getAvailability } from '../../../lib/roomsApi';
import { createBooking, BookingPayload, getBookings, checkInBooking, checkOutBooking, editBookingRooms } from '../../../lib/roomBookApi';
import { printBookingBill } from '../../../utils/printReceipt';

export default function BookRoomPage() {
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    checkIn: '',
    checkOut: '',
    specialRequests: '',
  });

  const [rooms, setRooms] = useState([
    { id: 1, roomCode: '', rateplanCode: '', adults: 1, children: 0 }
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

  // Manage Bookings State
  const [activeTab, setActiveTab] = useState<'book' | 'manage'>('book');
  const [searchPhone, setSearchPhone] = useState('');
  const [managedBookings, setManagedBookings] = useState<any[]>([]);
  const [searchingBookings, setSearchingBookings] = useState(false);
  const [modalMode, setModalMode] = useState<'checkin' | 'edit'>('checkin');
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [checkoutBooking, setCheckoutBooking] = useState<any>(null);
  const [openingModalBookingId, setOpeningModalBookingId] = useState<number | null>(null);

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

  const handleSearchBookings = async () => {
    setSearchingBookings(true);
    try {
      const data = await getBookings(searchPhone);
      setManagedBookings(data);
    } catch (error) {
      console.error('Failed to search bookings:', error);
    } finally {
      setSearchingBookings(false);
    }
  };

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

  const handleCheckOut = async (booking: any) => {
    setSearchingBookings(true);
    try {
      await checkOutBooking(booking.id);
      setFormSuccess("Checked out successfully!");
      handleSearchBookings();
    } catch (error: any) {
      setFormError(error.response?.data?.message || 'Failed to check out. Please try again.');
      setSearchingBookings(false);
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
    }
    setRooms(newRooms);
  };

  const addRoom = () => {
    setRooms([...rooms, { id: Date.now(), roomCode: '', rateplanCode: '', adults: 1, children: 0 }]);
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

      const payload: BookingPayload = {
        ...formData,
        totalAdults,
        totalChildren,
        rooms: rooms.map(r => ({
          roomCode: r.roomCode,
          rateplanCode: r.rateplanCode,
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
    setRooms([{ id: Date.now(), roomCode: '', rateplanCode: '', adults: 1, children: 0 }]);
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
                </div>
              </div>
            </div>

            {/* Card 3: Room Allocation */}
            <div className="bg-surface border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Bed size={18} className="text-emerald-400" /> Room Allocation
                </h2>
                <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-lg border border-emerald-500/20">
                  {rooms.length} {rooms.length === 1 ? 'Room' : 'Rooms'}
                </span>
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

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="md:col-span-2">
                                <label className={labelClass}>Room Type</label>
                                <div className="relative group">
                                  <Bed size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors z-10" />
                                  <select
                                    required
                                    value={room.roomCode}
                                    onChange={(e) => handleRoomChange(index, 'roomCode', e.target.value)}
                                    className={`${inputClass} appearance-none pl-10 bg-black/40`}
                                  >
                                    <option value="" disabled>Select a type...</option>
                                    {roomTypes.map((type) => {
                                      const availForType = availability[type.roomCode];
                                      const availText = checkingAvail
                                        ? ' - Checking...'
                                        : (typeof availForType === 'number' ? ` - ${availForType} available` : '');
                                      return (
                                        <option key={type.id} value={type.roomCode}>
                                          {type.name}{availText}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                              </div>

                              <div className="md:col-span-2">
                                <label className={labelClass}>Rate Plan</label>
                                <div className="relative group">
                                  <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors z-10" />
                                  <select
                                    required
                                    value={room.rateplanCode}
                                    onChange={(e) => handleRoomChange(index, 'rateplanCode', e.target.value)}
                                    className={`${inputClass} appearance-none pl-10 bg-black/40 disabled:opacity-50`}
                                    disabled={!room.roomCode || ratePlans.length === 0}
                                  >
                                    <option value="" disabled>Select rate plan...</option>
                                    {ratePlans.map((plan: any) => (
                                      <option key={plan.code} value={plan.code}>
                                        {plan.code} - ₹{plan.price}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="md:col-span-2 lg:col-span-1">
                                <label className={labelClass}>Adults</label>
                                <div className="relative group">
                                  <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                                  <input
                                    type="number"
                                    min="1"
                                    required
                                    value={room.adults}
                                    onChange={(e) => handleRoomChange(index, 'adults', parseInt(e.target.value) || 1)}
                                    className={`${inputClass} pl-10 bg-black/40`}
                                  />
                                </div>
                              </div>

                              <div className="md:col-span-2 lg:col-span-1">
                                <label className={labelClass}>Children</label>
                                <div className="relative group">
                                  <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                                  <input
                                    type="number"
                                    min="0"
                                    required
                                    value={room.children}
                                    onChange={(e) => handleRoomChange(index, 'children', parseInt(e.target.value) || 0)}
                                    className={`${inputClass} pl-10 bg-black/40`}
                                  />
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
            </div>

            {/* Action Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors text-sm flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> Reset
              </button>
              <button
                type="submit"
                disabled={loading || checkingAvail}
                className={`px-8 py-3 rounded-xl flex items-center justify-center gap-2 text-white font-bold transition-all text-sm ${(loading || checkingAvail) ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 hover:-translate-y-0.5'}`}
              >
                {checkingAvail ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                {checkingAvail ? 'Checking Availability...' : 'Continue to Assignment'}
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
                  <p className="text-xs text-slate-400 mt-0.5">Find active or past bookings by guest phone number</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    value={searchPhone}
                    onChange={e => setSearchPhone(e.target.value)}
                    placeholder="Enter phone number (e.g. 9876543210)"
                    className={`${inputClass} pl-10 bg-black/40`}
                    onKeyDown={e => e.key === 'Enter' && handleSearchBookings()}
                  />
                </div>
                <button
                  onClick={handleSearchBookings}
                  disabled={searchingBookings}
                  className="bg-primary hover:bg-primary-hover px-6 py-3 rounded-xl text-white font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:-translate-y-0.5"
                >
                  {searchingBookings ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                  <span>{searchingBookings ? 'Searching...' : 'Search Bookings'}</span>
                </button>
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
                  {managedBookings.map(b => {
                    const isPaid = b.paymentStatus === 'PAID';

                    const roomSummary = (() => {
                      const roomsArr = Array.isArray(b.rooms) ? b.rooms : [];
                      if (roomsArr.length === 0) return 'No Rooms';

                      const groups: Record<string, string[]> = {};
                      const unassignedCounts: Record<string, number> = {};

                      roomsArr.forEach((r: any) => {
                        const code = r.roomCode || 'Room';
                        if (r.roomNumber) {
                          if (!groups[code]) groups[code] = [];
                          groups[code].push(r.roomNumber);
                        } else {
                          unassignedCounts[code] = (unassignedCounts[code] || 0) + 1;
                        }
                      });

                      const formatted: string[] = [];
                      Object.keys(groups).forEach(code => {
                        formatted.push(`${code}: ${groups[code].join(', ')}`);
                      });
                      Object.keys(unassignedCounts).forEach(code => {
                        formatted.push(`${unassignedCounts[code]}x ${code}`);
                      });

                      return formatted.join(' | ') || `${roomsArr.length} Room(s)`;
                    })();

                    return (
                      <div key={b.id} className="bg-surface border border-white/10 rounded-2xl p-5 sm:p-6 transition-all hover:border-white/20 shadow-lg space-y-4">
                        {/* Top Row: Guest Info & Status Badge */}
                        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                              {(b.guestName || 'G').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{b.guestName || 'Guest'}</h3>
                              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <Phone size={13} className="text-slate-500" /> {b.guestPhone}
                              </p>
                            </div>
                          </div>

                          {/* Status Badges */}
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${b.status === 'CHECKED_IN'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : b.status === 'RESERVED'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  : b.status === 'CHECKED_OUT'
                                    ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${b.status === 'CHECKED_IN' ? 'bg-emerald-400 animate-pulse' : b.status === 'RESERVED' ? 'bg-blue-400' : 'bg-slate-400'
                                }`} />
                              {b.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Middle Details Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                            <div className="text-slate-400 mb-1 flex items-center gap-1">
                              <Calendar size={13} className="text-slate-500" /> Check In
                            </div>
                            <div className="font-semibold text-slate-200">
                              {new Date(b.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                          </div>

                          <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                            <div className="text-slate-400 mb-1 flex items-center gap-1">
                              <Calendar size={13} className="text-slate-500" /> Check Out
                            </div>
                            <div className="font-semibold text-slate-200">
                              {new Date(b.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                          </div>

                          <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                            <div className="text-slate-400 mb-1 flex items-center gap-1">
                              <Bed size={13} className="text-slate-500" /> Rooms Assigned
                            </div>
                            <div className="font-semibold text-slate-200 truncate" title={roomSummary}>
                              {roomSummary}
                            </div>
                          </div>

                          <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                            <div className="text-slate-400 mb-1 flex items-center gap-1">
                              <CreditCard size={13} className="text-slate-500" /> Payment
                            </div>
                            <div className="flex items-center gap-1.5 font-semibold">
                              <span className="text-white font-mono">₹{Number(b.totalAmount || 0).toFixed(0)}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${isPaid ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                                {b.paymentStatus}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Action Bar */}
                        <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
                          {b.status === 'RESERVED' && (
                            <button
                              onClick={() => openAssignmentModal(b, 'checkin')}
                              disabled={searchingBookings || openingModalBookingId === b.id}
                              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                            >
                              {openingModalBookingId === b.id ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <Key size={15} />
                              )}
                              <span>{openingModalBookingId === b.id ? 'Opening...' : 'Check In'}</span>
                            </button>
                          )}

                          {b.status === 'CHECKED_IN' && (
                            <>
                              <button
                                onClick={() => openAssignmentModal(b, 'edit')}
                                disabled={searchingBookings || openingModalBookingId === b.id}
                                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-50 text-blue-400 border border-blue-500/20 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                              >
                                {openingModalBookingId === b.id ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : (
                                  <Bed size={15} />
                                )}
                                <span>{openingModalBookingId === b.id ? 'Opening...' : 'Change Room'}</span>
                              </button>
                              <button
                                onClick={() => setCheckoutBooking(b)}
                                disabled={searchingBookings || openingModalBookingId === b.id}
                                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle size={15} /> Check Out
                              </button>
                            </>
                          )}

                          {b.status === 'CHECKED_OUT' && (
                            <button
                              onClick={() => printBookingBill(b)}
                              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                            >
                              <Printer size={15} /> Print Bill
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {managedBookings.length === 0 && !searchingBookings && (
                    <div className="text-center py-14 px-4 text-slate-400 bg-surface/40 border border-white/5 rounded-2xl space-y-2">
                      <Search size={32} className="mx-auto text-slate-600 mb-2" />
                      <div className="text-slate-300 font-semibold">No Bookings Found</div>
                      <div className="text-xs text-slate-500 max-w-sm mx-auto">
                        Enter a guest phone number above to search and manage room assignments, check-ins, or check-outs.
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
              <div className="space-y-3 mb-6">
                <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3">
                  {/* Room Charge Row */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-300 font-medium flex items-center gap-2">
                      <Bed size={15} className="text-slate-400" /> Room Bill
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${checkoutBooking.paymentStatus === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                        {checkoutBooking.paymentStatus}
                      </span>
                      <span className="text-white font-bold font-mono">₹{Number(checkoutBooking.totalAmount ?? 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Restaurant Bill Row */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-300 font-medium flex items-center gap-2">
                      <Tag size={15} className="text-slate-400" /> Restaurant Bill
                    </span>
                    <span className="text-white font-bold font-mono">₹{Number(checkoutBooking.foodTotalAmount ?? 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Total Highlight Card */}
                <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <div className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-0.5">Total Amount Due</div>
                    <div className="text-[11px] text-slate-500">
                      {checkoutBooking.paymentStatus === 'PAID' ? 'Room bill paid (showing food balance)' : 'Includes Room + Restaurant'}
                    </div>
                  </div>
                  <div className="text-emerald-400 font-black text-2xl font-mono tracking-tight">
                    ₹{(
                      (checkoutBooking.paymentStatus !== 'PAID' ? Number(checkoutBooking.totalAmount || 0) : 0) +
                      Number(checkoutBooking.foodTotalAmount || 0)
                    ).toFixed(2)}
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
                  onClick={() => printBookingBill(checkoutBooking)}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all text-sm font-bold whitespace-nowrap"
                >
                  <Printer size={16} /> Print Bill
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCheckOut(checkoutBooking);
                    setCheckoutBooking(null);
                  }}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all text-sm font-bold shadow-lg shadow-emerald-500/25 whitespace-nowrap"
                >
                  <CheckCircle size={16} /> Confirm Checkout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
