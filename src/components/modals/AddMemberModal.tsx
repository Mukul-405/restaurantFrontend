import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { fetcher } from '../../lib/fetcher';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMemberModal({ isOpen, onClose, onSuccess }: AddMemberModalProps) {
  const [formData, setFormData] = useState({ name: '', phoneNumber: '', role: 'WAITER', password: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name || !formData.phoneNumber || !formData.role || !formData.password) {
      setFormError('Name, Phone Number, Role, and Password are required.');
      return;
    }
    try {
      setFormLoading(true);
      const payload: any = { ...formData };
      await fetcher.createUser(payload);
      setFormData({ name: '', phoneNumber: '', role: 'WAITER', password: '' });
      onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create member');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="w-full max-w-[500px] p-8 bg-surface border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add New Member</h2>
              <button className="bg-transparent border-none text-slate-400 hover:text-slate-200 cursor-pointer p-1" onClick={onClose}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="mb-4 flex flex-col">
                <label className="block text-sm font-medium text-slate-400 mb-2">Name</label>
                <input 
                  type="text" 
                  className="w-full bg-black/20 border border-white/10 text-slate-200 px-4 py-3 rounded-lg font-sans text-base transition-all duration-300 outline-none focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-light)]" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div className="mb-4 flex flex-col">
                <label className="block text-sm font-medium text-slate-400 mb-2">Phone Number</label>
                <input 
                  type="text" 
                  className="w-full bg-black/20 border border-white/10 text-slate-200 px-4 py-3 rounded-lg font-sans text-base transition-all duration-300 outline-none focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-light)]" 
                  value={formData.phoneNumber} 
                  onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                />
              </div>
              <div className="mb-4 flex flex-col">
                <label className="block text-sm font-medium text-slate-400 mb-2">Role</label>
                <select 
                  className="w-full bg-black/20 border border-white/10 text-slate-200 px-4 py-3 rounded-lg font-sans text-base outline-none appearance-none [&>option]:bg-surface [&>option]:text-slate-200"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="WAITER">WAITER</option>
                  <option value="CASHIER">CASHIER</option>
                  <option value="KITCHEN_STAFF">KITCHEN_STAFF</option>
                  <option value="RECEPTIONIST">RECEPTIONIST</option>
                </select>
              </div>
              <div className="mb-4 flex flex-col">
                <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                <input 
                  type="password" 
                  className="w-full bg-black/20 border border-white/10 text-slate-200 px-4 py-3 rounded-lg font-sans text-base transition-all duration-300 outline-none focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-light)]" 
                  placeholder="Enter password"
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  maxLength={128}
                />
              </div>
              
              {formError && <div className="text-danger text-sm mt-4 text-center">{formError}</div>}

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border-none outline-none disabled:opacity-50 bg-transparent border border-white/10 text-slate-200 hover:bg-white/5" onClick={onClose}>Cancel</button>
                <button type="submit" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border-none outline-none disabled:opacity-50 bg-primary text-white shadow-[0_4px_14px_0_var(--color-primary-light)] hover:bg-primary-hover hover:-translate-y-[1px]" disabled={formLoading}>
                  {formLoading && <Loader2 className="animate-spin" size={16} />}
                  {formLoading ? 'Saving...' : 'Save Member'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
