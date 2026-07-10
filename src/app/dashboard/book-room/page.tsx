'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bed, Calendar, Users, User, Plus, Trash2, Mail, Phone, CreditCard, Sparkles, Loader2 } from 'lucide-react';
import { getRoomTypes, RoomType } from '../../../lib/roomsApi';
import { createBooking, BookingPayload } from '../../../lib/roomBookApi';

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
    { id: 1, roomCode: '', adults: 1, children: 0 }
  ]);

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const data = await getRoomTypes();
        // Only display active room types
        setRoomTypes(data.filter(rt => rt.isActive));
      } catch (error) {
        console.error('Failed to fetch room types:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoomTypes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoomChange = (index: number, field: string, value: string | number) => {
    const newRooms = [...rooms];
    newRooms[index] = { ...newRooms[index], [field]: value };
    setRooms(newRooms);
  };

  const addRoom = () => {
    setRooms([...rooms, { id: Date.now(), roomCode: '', adults: 1, children: 0 }]);
  };

  const removeRoom = (index: number) => {
    if (rooms.length > 1) {
      const newRooms = [...rooms];
      newRooms.splice(index, 1);
      setRooms(newRooms);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const totalAdults = rooms.reduce((sum, room) => sum + Number(room.adults), 0);
      const totalChildren = rooms.reduce((sum, room) => sum + Number(room.children), 0);
      
      const payload: BookingPayload = {
        ...formData,
        totalAdults,
        totalChildren,
        rooms: rooms.map(r => ({
          roomCode: r.roomCode,
          adults: Number(r.adults),
          children: Number(r.children)
        }))
      };
      
      await createBooking(payload);
      alert('Booking submitted successfully!');
      
      // Reset form
      setFormData({
        guestName: '',
        guestEmail: '',
        guestPhone: '',
        checkIn: '',
        checkOut: '',
        specialRequests: '',
      });
      setRooms([{ id: Date.now(), roomCode: '', adults: 1, children: 0 }]);
    } catch (error) {
      console.error('Booking submission failed:', error);
      // Fallback message for now since backend might not have the route implemented yet
      alert('Booking form is connected to roomBookApi. Backend integration needed to process /bookings endpoint.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 hover:border-white/20";
  const labelClass = "block text-xs font-semibold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider";

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3 border border-primary/20">
            <Sparkles size={14} />
            <span>New Reservation</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            Book a Room
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Create a new direct booking and allocate multiple rooms if needed.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Guest & Stay Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Guest Information Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex items-center gap-3 mb-6 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/10">
                <User size={20} />
              </div>
              <h2 className="text-xl font-semibold text-white">Guest Information</h2>
            </div>

            <div className="space-y-5 relative">
              <div>
                <label className={labelClass}>Full Name</label>
                <input type="text" name="guestName" required value={formData.guestName} onChange={handleChange} className={inputClass} placeholder="Enter guest's full name" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="tel" name="guestPhone" required value={formData.guestPhone} onChange={handleChange} className={`${inputClass} pl-11`} placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="email" name="guestEmail" value={formData.guestEmail} onChange={handleChange} className={`${inputClass} pl-11`} placeholder="guest@example.com" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stay Details Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-surface/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="flex items-center gap-3 mb-6 relative">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-500/10">
                <Calendar size={20} />
              </div>
              <h2 className="text-xl font-semibold text-white">Stay Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative">
              <div>
                <label className={labelClass}>Check-in Date</label>
                <input type="date" name="checkIn" required value={formData.checkIn} onChange={handleChange} className={`${inputClass} [color-scheme:dark]`} />
              </div>
              <div>
                <label className={labelClass}>Check-out Date</label>
                <input type="date" name="checkOut" required value={formData.checkOut} onChange={handleChange} className={`${inputClass} [color-scheme:dark]`} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Rooms Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-surface/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 relative flex flex-col h-full">
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                  <Bed size={20} />
                </div>
                <h2 className="text-xl font-semibold text-white">Room Allocation</h2>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20">
                {rooms.length} {rooms.length === 1 ? 'Room' : 'Rooms'}
              </span>
            </div>

            <div className="space-y-4 flex-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-3">
                  <Loader2 className="animate-spin text-primary" size={32} />
                  <p className="text-sm">Loading available room types...</p>
                </div>
              ) : (
                <AnimatePresence>
                  {rooms.map((room, index) => (
                    <motion.div 
                      key={room.id}
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95, margin: 0 }}
                      transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-black/20 border border-white/5 rounded-2xl p-5 relative group hover:border-white/10 transition-colors">
                        {/* Remove Room Button */}
                        {rooms.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeRoom(index)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors z-10"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}

                        <div className="mb-4">
                          <label className={labelClass}>Room {index + 1} Type</label>
                          <select
                            required
                            value={room.roomCode}
                            onChange={(e) => handleRoomChange(index, 'roomCode', e.target.value)}
                            className={`${inputClass} appearance-none bg-black/40 ${rooms.length > 1 ? 'pr-10' : ''}`}
                          >
                            <option value="" disabled>Select a type...</option>
                            {roomTypes.map((type) => (
                              <option key={type.id} value={type.roomCode}>
                                {type.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Adults</label>
                            <div className="relative">
                              <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
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
                          <div>
                            <label className={labelClass}>Children</label>
                            <div className="relative">
                              <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
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
                  ))}
                </AnimatePresence>
              )}

              {!loading && (
                <motion.button
                  type="button"
                  onClick={addRoom}
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-all flex items-center justify-center gap-2 font-medium mt-4"
                >
                  <Plus size={18} />
                  Add Another Room
                </motion.button>
              )}

              <div className="pt-4">
                <label className={labelClass}>Special Requests (Optional)</label>
                <textarea
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleChange}
                  rows={3}
                  className={`${inputClass} resize-none`}
                  placeholder="Any preferences or special requests..."
                ></textarea>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10">
              <button
                type="submit"
                disabled={loading || submitting}
                className={`w-full ${loading || submitting ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/40'} text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-primary/20 transform flex items-center justify-center gap-2 text-lg`}
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <CreditCard size={20} />
                )}
                {submitting ? 'Confirming...' : 'Confirm Reservation'}
              </button>
            </div>
            
          </motion.div>
        </div>

      </form>
    </div>
  );
}
