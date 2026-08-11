import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Home } from 'lucide-react';
import { getRoomTypes, RoomType } from '../../lib/roomsApi';

interface TransferToRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { userRoomBookingId: number }) => Promise<void>;
  orderId: number;
}

export default function TransferToRoomModal({ isOpen, onClose, onSubmit, orderId }: TransferToRoomModalProps) {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState('All');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedInRooms, setCheckedInRooms] = useState<{ roomNumber: string; userRoomBookingId: number; roomTypeName: string }[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  const uniqueRoomTypes = Array.from(new Set(checkedInRooms.map(r => r.roomTypeName)));
  const filteredRooms = selectedRoomType === 'All' 
    ? checkedInRooms 
    : checkedInRooms.filter(r => r.roomTypeName === selectedRoomType);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingRooms(true);
      getRoomTypes()
        .then((roomTypes) => {
          const roomsMap = new Map<string, { roomNumber: string; userRoomBookingId: number; roomTypeName: string }>();
          roomTypes.forEach(rt => {
            if (rt.rooms) {
              rt.rooms.forEach(r => {
                if (r.status === 'checked in' && r.userRoomBookingId) {
                  const key = `${r.roomNumber}-${r.userRoomBookingId}-${rt.name}`;
                  if (!roomsMap.has(key)) {
                    roomsMap.set(key, {
                      roomNumber: r.roomNumber,
                      userRoomBookingId: Number(r.userRoomBookingId),
                      roomTypeName: rt.name
                    });
                  }
                }
              });
            }
          });
          setCheckedInRooms(Array.from(roomsMap.values()));
        })
        .catch(err => {
          console.error(err);
          setError('Failed to fetch rooms');
        })
        .finally(() => {
          setIsLoadingRooms(false);
        });
    } else {
      setSelectedRoom('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) {
      setError('Please select a room');
      return;
    }

    const roomData = checkedInRooms.find(r => `${r.roomNumber}-${r.userRoomBookingId}-${r.roomTypeName}` === selectedRoom);
    if (!roomData) {
      setError('Invalid room selected');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ userRoomBookingId: roomData.userRoomBookingId });
      setSelectedRoom('');
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#1a1b1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Transfer Order #{orderId} to Room
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
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

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Filter by Room Type
                </label>
                <div className="relative">
                  <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    value={selectedRoomType}
                    onChange={(e) => {
                      setSelectedRoomType(e.target.value);
                      setSelectedRoom('');
                    }}
                    className="w-full bg-black/20 border border-white/10 text-slate-200 pl-11 pr-4 py-3 rounded-xl font-sans text-sm outline-none focus:border-primary placeholder-slate-500 appearance-none"
                    disabled={isLoadingRooms || uniqueRoomTypes.length === 0}
                  >
                    <option value="All" className="bg-[#24262b]">All Room Types</option>
                    {uniqueRoomTypes.map((type) => (
                      <option key={type} value={type} className="bg-[#24262b]">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select Room
                </label>
                <div className="relative">
                  <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 text-slate-200 pl-11 pr-4 py-3 rounded-xl font-sans text-sm outline-none focus:border-primary placeholder-slate-500 appearance-none"
                    required
                    disabled={isLoadingRooms || filteredRooms.length === 0}
                  >
                    <option value="" disabled className="bg-[#24262b]">
                      {isLoadingRooms ? 'Loading rooms...' : 'Choose a checked-in room'}
                    </option>
                    {filteredRooms.map((room) => (
                      <option key={`${room.roomNumber}-${room.userRoomBookingId}-${room.roomTypeName}`} value={`${room.roomNumber}-${room.userRoomBookingId}-${room.roomTypeName}`} className="bg-[#24262b]">
                        Room {room.roomNumber} - {room.roomTypeName}
                      </option>
                    ))}
                  </select>
                </div>
                {filteredRooms.length === 0 && !isLoadingRooms && (
                  <p className="mt-2 text-xs text-amber-400">
                    No checked-in rooms available for this type.
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-400">
                  The order total will be added to the active room booking associated with this room.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || checkedInRooms.length === 0}
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
