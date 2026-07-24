import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Loader2 } from 'lucide-react';

interface RoomTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: any;
}

export default function RoomTypeModal({ isOpen, onClose, onSave, initialData }: RoomTypeModalProps) {
  const [formData, setFormData] = useState({
    name: '', roomCode: '', description: '', maxAdults: 2, maxChildren: 0, totalRooms: 1, isActive: true,
    basePrice: '', extraPersonAmount: '0', rateplanCodes: [] as {code: string, price: string}[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        basePrice: initialData.basePrice?.toString() || '',
        extraPersonAmount: initialData.extraPersonAmount?.toString() || '0',
        rateplanCodes: Array.isArray(initialData.rateplanCodes) ? initialData.rateplanCodes.map((r: any) => ({code: r.code, price: r.price?.toString() || '0'})) : []
      });
    } else {
      setFormData({ name: '', roomCode: '', description: '', maxAdults: 2, maxChildren: 0, totalRooms: 1, isActive: true, basePrice: '', extraPersonAmount: '0', rateplanCodes: [] });
    }
  }, [initialData, isOpen]);

  const addRatePlan = () => {
    setFormData(prev => ({ ...prev, rateplanCodes: [...prev.rateplanCodes, { code: '', price: '' }] }));
  };

  const updateRatePlan = (index: number, field: 'code'|'price', value: string) => {
    setFormData(prev => {
      const newPlans = [...prev.rateplanCodes];
      newPlans[index] = { ...newPlans[index], [field]: value };
      return { ...prev, rateplanCodes: newPlans };
    });
  };

  const removeRatePlan = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rateplanCodes: prev.rateplanCodes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSave({
        ...formData,
        maxAdults: parseInt(formData.maxAdults.toString()),
        maxChildren: parseInt(formData.maxChildren.toString()),
        totalRooms: parseInt(formData.totalRooms.toString()),
        basePrice: parseFloat(formData.basePrice) || 0,
        extraPersonAmount: parseFloat(formData.extraPersonAmount) || 0,
        rateplanCodes: formData.rateplanCodes.filter(r => r.code).map(r => ({ code: r.code, price: parseFloat(r.price) || 0 }))
      });
      onClose();
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err?.message || 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="w-full max-w-[500px] p-8 bg-surface border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{initialData ? 'Edit Room Type' : 'Add Room Type'}</h2>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                <input required type="text" className="w-full bg-black/20 border border-white/10 px-4 py-2 rounded-lg text-slate-200 outline-none focus:border-primary" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Room Code</label>
                <input required type="text" className="w-full bg-black/20 border border-white/10 px-4 py-2 rounded-lg text-slate-200 outline-none focus:border-primary" value={formData.roomCode} onChange={e => setFormData({...formData, roomCode: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                <textarea className="w-full bg-black/20 border border-white/10 px-4 py-2 rounded-lg text-slate-200 outline-none focus:border-primary resize-none h-24" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Optional room description..."></textarea>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Max Adults</label>
                  <input required type="number" min="1" className="w-full bg-black/20 border border-white/10 px-4 py-2 rounded-lg text-slate-200 outline-none focus:border-primary" value={formData.maxAdults} onChange={e => setFormData({...formData, maxAdults: parseInt(e.target.value)})} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Max Children</label>
                  <input required type="number" min="0" className="w-full bg-black/20 border border-white/10 px-4 py-2 rounded-lg text-slate-200 outline-none focus:border-primary" value={formData.maxChildren} onChange={e => setFormData({...formData, maxChildren: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Base Price</label>
                  <input required type="number" min="0" step="0.01" className="w-full bg-black/20 border border-white/10 px-4 py-2 rounded-lg text-slate-200 outline-none focus:border-primary" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Extra Person Cost</label>
                  <input required type="number" min="0" step="0.01" className="w-full bg-black/20 border border-white/10 px-4 py-2 rounded-lg text-slate-200 outline-none focus:border-primary" value={formData.extraPersonAmount} onChange={e => setFormData({...formData, extraPersonAmount: e.target.value})} />
                </div>
              </div>
              
              <div className="mt-2 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-bold text-slate-300">Rate Plans</label>
                  <button type="button" onClick={addRatePlan} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
                    <Plus size={14} /> Add Plan
                  </button>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {formData.rateplanCodes.map((plan, index) => (
                    <div key={index} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-400 mb-1">Plan Code</label>
                        <input required type="text" placeholder="e.g. EP, MAP" className="w-full bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-slate-200 text-sm outline-none focus:border-primary" value={plan.code} onChange={e => updateRatePlan(index, 'code', e.target.value)} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-400 mb-1">Price / Modifier</label>
                        <input required type="number" step="0.01" className="w-full bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-slate-200 text-sm outline-none focus:border-primary" value={plan.price} onChange={e => updateRatePlan(index, 'price', e.target.value)} />
                      </div>
                      <button type="button" onClick={() => removeRatePlan(index)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mb-0.5">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {formData.rateplanCodes.length === 0 && (
                    <p className="text-sm text-slate-500 italic text-center py-2">No rate plans defined.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Total Rooms</label>
                  <input required type="number" min="0" className="w-full bg-black/20 border border-white/10 px-4 py-2 rounded-lg text-slate-200 outline-none focus:border-primary" value={formData.totalRooms} onChange={e => setFormData({...formData, totalRooms: parseInt(e.target.value)})} />
                </div>
                <div className="flex-1 flex items-end mb-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 accent-primary" />
                    Is Active
                  </label>
                </div>
              </div>
              {error && <div className="text-danger text-sm text-center">{error}</div>}
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg border border-white/10 text-slate-200 hover:bg-white/5 font-semibold text-sm">Cancel</button>
                <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-hover font-semibold text-sm disabled:opacity-50">
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
