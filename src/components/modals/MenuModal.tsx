import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { MenuItem, Category } from '../../store/slices/menuSlice';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  item?: MenuItem | null;
  categories: Category[];
}

export default function MenuModal({ isOpen, onClose, onSave, item, categories }: MenuModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryName: '',
    isAvailable: true,
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || '',
        price: String(item.price),
        categoryName: item.categoryName || '',
        isAvailable: item.isAvailable !== false,
      });
    } else {
      setFormData({ name: '', description: '', price: '', categoryName: '', isAvailable: true });
    }
    setFormError('');
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name || !formData.price || !formData.categoryName) {
      setFormError('Name, Price, and Category are required.');
      return;
    }
    try {
      setFormLoading(true);
      const payload: any = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        categoryName: formData.categoryName,
        isAvailable: formData.isAvailable,
      };
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setFormError(err || 'Failed to save menu item');
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
              <h2 className="text-xl font-bold">{item ? 'Edit Menu Item' : 'Add New Item'}</h2>
              <button type="button" className="bg-transparent border-none text-slate-400 hover:text-slate-200 cursor-pointer p-1" onClick={onClose}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4 flex flex-col">
                <label className="block text-sm font-medium text-slate-400 mb-2">Item Name</label>
                <input 
                  type="text" 
                  className="w-full bg-black/20 border border-white/10 text-slate-200 px-4 py-3 rounded-lg font-sans text-base transition-all duration-300 outline-none focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-light)]" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div className="mb-4 flex flex-col">
                <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                <textarea 
                  className="w-full bg-black/20 border border-white/10 text-slate-200 px-4 py-3 rounded-lg font-sans text-base transition-all duration-300 outline-none focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-light)] min-h-[100px] resize-y" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              <div className="mb-4 flex flex-col">
                <label className="block text-sm font-medium text-slate-400 mb-2">Price</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full bg-black/20 border border-white/10 text-slate-200 px-4 py-3 rounded-lg font-sans text-base transition-all duration-300 outline-none focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-light)]" 
                  value={formData.price} 
                  onChange={e => setFormData({...formData, price: e.target.value})} 
                />
              </div>

              <div className="mb-4 flex flex-col relative">
                <label className="block text-sm font-medium text-slate-400 mb-2">Category</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Select or type a new category"
                    className="w-full bg-black/20 border border-white/10 text-slate-200 px-4 py-3 rounded-lg font-sans text-base transition-all duration-300 outline-none focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-light)]" 
                    value={formData.categoryName}
                    onChange={e => setFormData({...formData, categoryName: e.target.value})}
                    onFocus={() => setIsDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                  />
                  <AnimatePresence>
                    {isDropdownOpen && categories.filter(c => c.name.toLowerCase().includes(formData.categoryName.toLowerCase())).length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 w-full mt-2 bg-surface border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                      >
                        {categories
                          .filter(c => c.name.toLowerCase().includes(formData.categoryName.toLowerCase()))
                          .map((cat) => (
                            <div
                              key={cat.id}
                              className="px-4 py-3 cursor-pointer hover:bg-white/10 text-slate-200 transition-colors"
                              onClick={() => {
                                setFormData({...formData, categoryName: cat.name});
                                setIsDropdownOpen(false);
                              }}
                            >
                              {cat.name}
                            </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {item && (
                <div className="mb-4 flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onChange={e => setFormData({...formData, isAvailable: e.target.checked})}
                    className="w-5 h-5 accent-primary rounded border-white/10 bg-black/20"
                  />
                  <label htmlFor="isAvailable" className="text-sm font-medium text-slate-200 cursor-pointer">
                    Available
                  </label>
                </div>
              )}
              
              {formError && <div className="text-danger text-sm mt-4 text-center">{formError}</div>}

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border-none outline-none disabled:opacity-50 bg-transparent border border-white/10 text-slate-200 hover:bg-white/5" onClick={onClose}>Cancel</button>
                <button type="submit" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border-none outline-none disabled:opacity-50 bg-primary text-white shadow-[0_4px_14px_0_var(--color-primary-light)] hover:bg-primary-hover hover:-translate-y-[1px]" disabled={formLoading}>
                  {formLoading ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
