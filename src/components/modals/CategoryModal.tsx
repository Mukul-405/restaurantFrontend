import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categories: string[]) => Promise<void>;
}

export default function CategoryModal({ isOpen, onClose, onSave }: CategoryModalProps) {
  const [categoryInput, setCategoryInput] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    if (!categoryInput.trim()) {
      setFormError('Category name is required.');
      return;
    }
    
    // Split by comma in case they want to add multiple at once
    const categories = categoryInput.split(',').map(c => c.trim()).filter(c => c);

    if (categories.length === 0) {
      setFormError('Please enter valid category names.');
      return;
    }

    try {
      setFormLoading(true);
      await onSave(categories);
      setCategoryInput('');
      onClose();
    } catch (err: any) {
      setFormError(err || 'Failed to create category');
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
            className="w-full max-w-[400px] p-8 bg-surface border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add Category</h2>
              <button type="button" className="bg-transparent border-none text-slate-400 hover:text-slate-200 cursor-pointer p-1" onClick={onClose}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4 flex flex-col">
                <label className="block text-sm font-medium text-slate-400 mb-2">Category Name(s)</label>
                <input 
                  type="text" 
                  className="w-full bg-black/20 border border-white/10 text-slate-200 px-4 py-3 rounded-lg font-sans text-base transition-all duration-300 outline-none focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-light)]" 
                  placeholder="e.g. BEVERAGES or SNACKS, DESSERTS"
                  value={categoryInput} 
                  onChange={e => setCategoryInput(e.target.value)} 
                />
                <span className="text-xs text-slate-500 mt-2">You can add multiple categories by separating them with commas.</span>
              </div>

              {formError && <div className="text-danger text-sm mt-4 text-center">{formError}</div>}

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border-none outline-none disabled:opacity-50 bg-transparent border border-white/10 text-slate-200 hover:bg-white/5" onClick={onClose}>Cancel</button>
                <button type="submit" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border-none outline-none disabled:opacity-50 bg-primary text-white shadow-[0_4px_14px_0_var(--color-primary-light)] hover:bg-primary-hover hover:-translate-y-[1px]" disabled={formLoading}>
                  {formLoading && <Loader2 className="animate-spin" size={16} />}
                  {formLoading ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
