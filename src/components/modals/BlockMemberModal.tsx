import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, ShieldCheck } from 'lucide-react';
import { fetcher } from '../../lib/fetcher';
import { User } from '../../context/AuthContext';

interface BlockMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: User | null;
}

export default function BlockMemberModal({ isOpen, onClose, onSuccess, member }: BlockMemberModalProps) {
  const [formLoading, setFormLoading] = useState(false);

  const handleBlockConfirm = async () => {
    if (!member) return;
    try {
      setFormLoading(true);
      if (member.isActive) {
        await fetcher.blockUser(member.id);
      } else {
        await fetcher.unblockUser(member.id);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Failed to update block status');
    } finally {
      setFormLoading(false);
    }
  };

  const isBlocking = member?.isActive;

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
              <h2 className="text-xl font-bold">{isBlocking ? 'Confirm Block' : 'Confirm Unblock'}</h2>
              <button className="bg-transparent border-none text-slate-400 hover:text-slate-200 cursor-pointer p-1" onClick={onClose}>
                <X size={24} />
              </button>
            </div>
            <div className="flex gap-4 items-start text-slate-400">
              {isBlocking ? <ShieldAlert size={24} className="text-warning shrink-0" /> : <ShieldCheck size={24} className="text-success shrink-0" />}
              <p>
                Are you sure you want to {isBlocking ? 'block' : 'unblock'} <strong className="text-slate-200">{member?.name}</strong>?
                {isBlocking && ' They will not be able to log in while blocked.'}
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button type="button" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border-none outline-none disabled:opacity-50 bg-transparent border border-white/10 text-slate-200 hover:bg-white/5" onClick={onClose}>Cancel</button>
              <button type="button" className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border-none outline-none disabled:opacity-50 text-white ${isBlocking ? 'bg-warning hover:bg-yellow-600' : 'bg-success hover:bg-green-600'}`} onClick={handleBlockConfirm} disabled={formLoading}>
                {formLoading ? (isBlocking ? 'Blocking...' : 'Unblocking...') : (isBlocking ? 'Yes, Block' : 'Yes, Unblock')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
