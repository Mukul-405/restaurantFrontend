import React, { useState } from 'react';
import { X, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoomType } from '../../lib/roomsApi';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roomTypeId: number, roomNumber: string) => Promise<void>;
  roomTypes: RoomType[];
}

export default function AddRoomModal({ isOpen, onClose, onSave, roomTypes }: AddRoomModalProps) {
  const [roomNumber, setRoomNumber] = useState('');
  const [roomTypeId, setRoomTypeId] = useState<number | ''>('');

  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (!roomNumber.trim() || roomTypeId === '') {
      setError('Please provide a room number and select a room type.');
      return;
    }
    try {
      await onSave(Number(roomTypeId), roomNumber.trim());
      setRoomNumber('');
      setRoomTypeId('');
      onClose();
    } catch (err: any) {
      setError(typeof err === 'string' ? err : err.message || 'Failed to add room.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-[400px] p-8 bg-surface border border-white/10 rounded-2xl shadow-2xl"
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Home size={20} className="text-emerald-400" /> Add Room
              </h2>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200"><X size={24} /></button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Room Number</label>
                <input
                  type="text"
                  className="w-full bg-black/20 border border-white/10 px-4 py-2.5 rounded-xl text-slate-200 outline-none focus:border-primary text-sm"
                  placeholder="e.g. 101"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Room Type</label>
                <select
                  className="w-full bg-black/20 border border-white/10 px-4 py-2.5 rounded-xl text-slate-200 outline-none focus:border-primary text-sm"
                  value={roomTypeId}
                  onChange={(e) => setRoomTypeId(Number(e.target.value))}
                >
                  <option value="" disabled>Select a room type</option>
                  {roomTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                  ))}
                </select>
              </div>

            </div>

            {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}

            <div className="mt-4">
              <button
                onClick={handleSave}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover transition-colors"
              >
                Save Room
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
