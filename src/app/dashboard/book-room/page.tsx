'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bed, Calendar, Users, User, Plus, Trash2, Mail, Phone, CreditCard, Loader2, Key, X, RefreshCw, Tag, AlignLeft, AlertCircle, CheckCircle2, Search, CheckCircle } from 'lucide-react';
import { getRoomTypes, RoomType, getAvailability } from '../../../lib/roomsApi';
import { createBooking, BookingPayload, getBookings, checkInBooking, checkOutBooking, editBookingRooms } from '../../../lib/roomBookApi';

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
                )})}
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
            <div className="bg-surface border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Search size={18} className="text-blue-400" /> Search Bookings
              </h2>
              <div className="flex gap-4 max-w-md">
                <input type="tel" value={searchPhone} onChange={e => setSearchPhone(e.target.value)} placeholder="Search by Phone Number" className={inputClass} />
                <button onClick={handleSearchBookings} disabled={searchingBookings} className="bg-primary hover:bg-primary-hover px-6 rounded-xl text-white font-bold transition-colors whitespace-nowrap flex items-center justify-center min-w-[120px]">
                  {searchingBookings ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {managedBookings.map(b => (
                <div key={b.id} className="bg-surface border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{b.guestName} <span className="text-sm font-normal text-slate-400 ml-2">{b.guestPhone}</span></h3>
                    <p className="text-slate-400 text-sm">
                      Check-in: {new Date(b.checkIn).toLocaleDateString()} &bull; Check-out: {new Date(b.checkOut).toLocaleDateString()}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      Rooms: {b.rooms?.length || 0}
                    </p>
                  </div>
                  <div>
                    {b.status === 'RESERVED' && (
                      <button onClick={() => openAssignmentModal(b, 'checkin')} className="bg-emerald-500 hover:bg-emerald-600 px-6 py-2 rounded-xl text-white font-bold transition-colors">
                        Check In
                      </button>
                    )}
                    {b.status === 'CHECKED_IN' && (
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <span className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 flex items-center gap-2">
                          <CheckCircle size={16} /> Checked In
                        </span>
                        <button onClick={() => openAssignmentModal(b, 'edit')} disabled={searchingBookings} className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-xl text-white font-bold transition-colors whitespace-nowrap">
                          Edit Room
                        </button>
                        <button onClick={() => handleCheckOut(b)} disabled={searchingBookings} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl text-white font-bold transition-colors whitespace-nowrap">
                          Check Out
                        </button>
                      </div>
                    )}
                    {b.status !== 'RESERVED' && b.status !== 'CHECKED_IN' && (
                      <span className="px-4 py-2 rounded-xl bg-slate-500/10 text-slate-400 font-bold border border-slate-500/20">
                        {b.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {managedBookings.length === 0 && !searchingBookings && (
                <div className="text-center py-12 text-slate-400 bg-surface/50 border border-white/5 rounded-2xl">
                  No bookings found. Enter a phone number and search.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Room Assignment Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-[500px] p-6 bg-surface border border-white/10 rounded-2xl shadow-2xl relative"
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  <Key size={20} className="text-amber-400" /> Assign Physical Rooms
                </h2>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={modalMode === 'checkin' ? handleConfirmCheckIn : handleConfirmEditRooms} className="space-y-4">
                <p className="text-slate-400 text-sm mb-2">Select physical room numbers for your booked types.</p>
                
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {assignments.map((assignment, index) => {
                    const roomType = roomTypes.find(rt => rt.roomCode === assignment.roomCode);
                    const availableRooms = (roomType?.rooms as any[])?.filter((r: any) => r.status === 'no status' || (modalMode === 'edit' && r.userRoomBookingId === selectedBookingId)) || [];

                    return (
                      <div key={assignment.id} className="bg-black/20 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white font-medium text-sm">Room {index + 1}</h3>
                          <span className="text-slate-400 text-xs">{roomType?.name || assignment.roomCode}</span>
                        </div>
                        
                        <div className="relative">
                          <select
                            required
                            value={assignment.roomNumber}
                            onChange={(e) => handleAssignmentChange(assignment.id, e.target.value)}
                            className={`${inputClass} appearance-none bg-black/40 py-2.5 text-sm`}
                          >
                            <option value="" disabled>Select Room Number</option>
                            {availableRooms.map((r: any) => {
                              const isSelectedElsewhere = assignments.some(a => a.id !== assignment.id && a.roomCode === assignment.roomCode && a.roomNumber === r.roomNumber);
                              return (
                                <option key={r.roomNumber} value={r.roomNumber} disabled={isSelectedElsewhere}>
                                  Room {r.roomNumber} {isSelectedElsewhere ? '(Selected)' : ''}
                                </option>
                              );
                            })}
                          </select>
                          {availableRooms.length === 0 && (
                            <p className="text-red-400 text-xs mt-2 bg-red-500/10 p-2 rounded border border-red-500/20">
                              No rooms available for this type.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-6 mt-4 border-t border-white/10 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-6 py-2.5 rounded-xl flex items-center gap-2 text-white font-bold transition-colors text-sm ${submitting ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20'}`}
                  >
                    {submitting ? <Loader2 className="animate-spin" size={16} /> : <Key size={16} />}
                    {submitting ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
