import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface GenericDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: React.ReactNode;
}

export default function GenericDeleteModal({ isOpen, onClose, onConfirm, title, message }: GenericDeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError('');
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err || 'Failed to delete');
    } finally {
      setLoading(false);
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
            className="w-full max-w-[400px] p-6 bg-surface border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] text-center"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
          >
            <div className="w-16 h-16 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-bold mb-2">{title}</h2>
            <div className="text-slate-400 mb-6">
              {message}
            </div>

            {error && <div className="text-danger text-sm mb-4">{error}</div>}

            <div className="flex justify-center gap-3">
              <button 
                type="button" 
                className="px-5 py-2.5 rounded-lg font-sans font-semibold text-sm transition-all bg-transparent border border-white/10 text-slate-200 hover:bg-white/5 disabled:opacity-50"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold text-sm transition-all bg-danger text-white shadow-[0_4px_14px_0_rgba(239,68,68,0.3)] hover:bg-red-600 hover:-translate-y-[1px] disabled:opacity-50"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading && <Loader2 className="animate-spin" size={16} />}
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
