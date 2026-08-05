import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Loader2, Eye, EyeOff } from 'lucide-react';
import { fetcher } from '../../lib/fetcher';
import { User } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import PasswordRequirements, { getPasswordError } from './PasswordRequirements';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: User | null;
}

export default function ResetPasswordModal({ isOpen, onClose, onSuccess, member }: ResetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!member) return;
    if (!password) {
      setFormError('New password is required');
      return;
    }
    const pwdErr = getPasswordError(password);
    if (pwdErr) {
      setFormError(pwdErr);
      return;
    }
    
    try {
      setFormLoading(true);
      setFormError('');
      await fetcher.resetPassword(member.id, password);
      setPassword('');
      onSuccess();
      onClose();
      toast.success(`Password successfully reset for ${member.name}. Active sessions have been revoked.`);
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to reset password');
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
            className="w-full max-w-[520px] p-8 bg-surface border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Key size={24} className="text-primary" />
                Reset Password
              </h2>
              <button className="bg-transparent border-none text-slate-400 hover:text-slate-200 cursor-pointer p-1" onClick={onClose}>
                <X size={24} />
              </button>
            </div>
            
            <p className="text-slate-400 mb-6 text-sm">
              You are resetting the password for <strong className="text-slate-200">{member?.name}</strong>. 
              This will automatically revoke all their active sessions.
            </p>

            <form onSubmit={handleResetSubmit}>
              <div className="mb-4 flex flex-col">
                <label className="block text-sm font-medium text-slate-400 mb-2">New Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    className="w-full bg-black/20 border border-white/10 text-slate-200 pl-4 pr-11 py-3 rounded-lg font-sans text-base transition-all duration-300 outline-none focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-light)]" 
                    placeholder="Enter new strong password"
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    maxLength={128}
                  />
                  <button 
                    type="button" 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 bg-transparent border-none p-1 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <PasswordRequirements password={password} />
              </div>
              
              {formError && <div className="text-danger text-sm mt-4 text-center">{formError}</div>}

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border-none outline-none disabled:opacity-50 bg-transparent border border-white/10 text-slate-200 hover:bg-white/5" onClick={onClose}>Cancel</button>
                <button type="submit" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border-none outline-none disabled:opacity-50 bg-primary text-white shadow-[0_4px_14px_0_var(--color-primary-light)] hover:bg-primary-hover hover:-translate-y-[1px]" disabled={formLoading}>
                  {formLoading && <Loader2 className="animate-spin" size={16} />}
                  {formLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
