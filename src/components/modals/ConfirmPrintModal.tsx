import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmPrintModalProps {
  isOpen: boolean;
  onConfirm: (success: boolean) => void;
}

export function ConfirmPrintModal({ isOpen, onConfirm }: ConfirmPrintModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center"
          >
            <h3 className="text-xl font-bold text-slate-100 mb-2">Clear Pending KOT?</h3>
            <p className="text-slate-400 mb-8 text-sm">
              Do you want to clear these items from the pending KOT list?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => onConfirm(true)}
                className="w-full px-4 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover shadow-[0_2px_10px_0_var(--color-primary-light)] transition-all"
              >
                Yes, clear it
              </button>
              <button
                onClick={() => onConfirm(false)}
                className="w-full px-4 py-3 rounded-xl font-bold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors"
              >
                No, keep it
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
