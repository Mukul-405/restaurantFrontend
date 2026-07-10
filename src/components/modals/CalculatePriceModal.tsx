import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Users as UsersIcon, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CalculatePriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomType: any;
}

export default function CalculatePriceModal({ isOpen, onClose, roomType }: CalculatePriceModalProps) {
  const [nights, setNights] = useState(1);
  const [extraGuests, setExtraGuests] = useState(0);
  const [ratePlanCode, setRatePlanCode] = useState('');

  const [totalPrice, setTotalPrice] = useState<number | null>(null);

  const handleCalculate = () => {
    if (nights < 1) return;
    
    let roomPrice = parseFloat(roomType.basePrice) || 0;
    
    if (ratePlanCode && roomType.rateplanCodes) {
      const selectedPlan = roomType.rateplanCodes.find((p: any) => p.code === ratePlanCode);
      if (selectedPlan) {
        roomPrice = parseFloat(selectedPlan.price) || 0;
      }
    }

    const extraCostPerGuest = parseFloat(roomType.extraPersonAmount) || 0;
    const dailyPrice = roomPrice + (extraGuests * extraCostPerGuest);

    setTotalPrice(dailyPrice * nights);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="w-full max-w-[450px] p-8 bg-surface border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><IndianRupee size={20} className="text-emerald-400" /> Calculate Price</h2>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200"><X size={24} /></button>
            </div>
            
            <div className="flex flex-col gap-5">
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <p className="text-sm font-semibold text-slate-300 mb-1">{roomType.name}</p>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Base: ₹{roomType.basePrice || 0}</span>
                  <span>Extra Guest: ₹{roomType.extraPersonAmount || 0}</span>
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-400 mb-1">Number of Nights</label>
                <div className="relative">
                  <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="number" min="1" className="w-full bg-black/20 border border-white/10 pl-10 pr-4 py-2.5 rounded-xl text-slate-200 outline-none focus:border-primary text-sm" value={nights} onChange={e => setNights(parseInt(e.target.value) || 1)} />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Extra Guests</label>
                  <div className="relative">
                    <UsersIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="number" min="0" className="w-full bg-black/20 border border-white/10 pl-10 pr-4 py-2.5 rounded-xl text-slate-200 outline-none focus:border-primary text-sm" value={extraGuests} onChange={e => setExtraGuests(parseInt(e.target.value) || 0)} />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Rate Plan</label>
                  <select className="w-full bg-black/20 border border-white/10 px-4 py-2.5 rounded-xl text-slate-200 outline-none focus:border-primary text-sm appearance-none" value={ratePlanCode} onChange={e => setRatePlanCode(e.target.value)}>
                    <option value="">Default (No Plan)</option>
                    {roomType.rateplanCodes?.map((plan: any) => (
                      <option key={plan.code} value={plan.code}>{plan.code} (+₹{plan.price})</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="button" onClick={handleCalculate} className="w-full py-3 mt-2 rounded-xl bg-primary text-white hover:bg-primary-hover font-bold shadow-lg transition-colors">
                Calculate Total
              </button>

              {totalPrice !== null && (
                <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex flex-col items-center justify-center">
                  <span className="text-sm text-emerald-400 font-medium mb-1">Estimated Price</span>
                  <span className="text-3xl font-bold text-white tracking-tight flex items-center">
                    <IndianRupee size={28} className="mr-1" />
                    {totalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
