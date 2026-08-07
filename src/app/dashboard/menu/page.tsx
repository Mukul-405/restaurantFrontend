'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Loader2, RefreshCw, FolderPlus, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchMenu, createMenuItem, updateMenuItem, deleteMenuItem, createCategories, MenuItem } from '../../../store/slices/menuSlice';
import { matchesMenuSearch } from '../../../utils/menuSearch';
import MenuModal from '../../../components/modals/MenuModal';
import DeleteConfirmModal from '../../../components/modals/DeleteConfirmModal';
import CategoryModal from '../../../components/modals/CategoryModal';

export default function MenuManagementPage() {
  const dispatch = useAppDispatch();
  const { items, categories, status, error } = useAppSelector((state) => state.menu);

  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchMenu());
  }, [dispatch]);

  const handleOpenCreate = () => {
    setSelectedItem(null);
    setIsMenuModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setSelectedItem(item);
    setIsMenuModalOpen(true);
  };

  const handleOpenDelete = (item: MenuItem) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleSaveItem = async (data: any) => {
    if (selectedItem) {
      await dispatch(updateMenuItem({ id: selectedItem.id, data })).unwrap();
    } else {
      await dispatch(createMenuItem(data)).unwrap();
    }
    dispatch(fetchMenu());
  };

  const handleSaveCategories = async (categoryNames: string[]) => {
    await dispatch(createCategories(categoryNames)).unwrap();
    dispatch(fetchMenu());
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const handleDeleteConfirm = async (id: string | number) => {
    await dispatch(deleteMenuItem(id)).unwrap();
  };

  const filteredItems = items.filter(item => matchesMenuSearch(item, searchQuery));

  const groupedItems = filteredItems.reduce((acc, item) => {
    const cat = item.categoryName || 'UNCATEGORIZED';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (status === 'loading' && items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (status === 'failed' && items.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center">
        <p className="text-danger mb-4">{error}</p>
        <button 
          onClick={() => dispatch(fetchMenu())}
          className="flex items-center gap-2 text-primary hover:text-primary-hover"
        >
          <RefreshCw size={16} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Menu Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your menu items and categories.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border border-white/10 outline-none bg-surface/50 text-slate-200 hover:bg-white/5"
          >
            <FolderPlus size={18} />
            <span>Add Category</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border-none outline-none bg-primary text-white shadow-[0_4px_14px_0_var(--color-primary-light)] hover:bg-primary-hover hover:-translate-y-[1px]"
          >
            <Plus size={18} />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search menu items or categories..." 
          className="w-full bg-black/20 border border-white/10 text-slate-200 pl-11 pr-4 py-3 rounded-xl font-sans text-base transition-all duration-300 outline-none focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-light)]"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            // Automatically expand categories if searching
            if (e.target.value) {
              const newExpanded: Record<string, boolean> = {};
              Object.keys(groupedItems).forEach(cat => {
                newExpanded[cat] = true;
              });
              setExpandedCategories(prev => ({ ...prev, ...newExpanded }));
            }
          }}
        />
      </div>

      {Object.keys(groupedItems).length === 0 && status !== 'loading' ? (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
          <div className="text-center text-slate-400">
            <p>No menu items found.</p>
            <p className="text-sm mt-1">Click the button above to add one.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 space-y-8">
          {Object.entries(groupedItems).map(([categoryName, catItems], index) => (
            <motion.div
              key={categoryName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-surface/50 border border-white/10 rounded-2xl overflow-hidden"
            >
              <div 
                className="bg-white/5 px-6 py-4 border-b border-white/10 flex justify-between items-center cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => toggleCategory(categoryName)}
              >
                <h2 className="text-lg font-bold text-slate-200 tracking-wide">{categoryName}</h2>
                <div className="text-slate-400">
                  {expandedCategories[categoryName] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </div>
              
              <AnimatePresence>
                {expandedCategories[categoryName] && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="divide-y divide-white/5 overflow-hidden"
                  >
                    {catItems.map((item) => (
                      <div key={item.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-slate-200 text-lg">{item.name}</h3>
                            {item.isAvailable ? (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                                Available
                              </span>
                            ) : (
                              <span className="text-[10px] bg-danger/20 text-danger px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                                Unavailable
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-slate-400 text-sm mb-2">{item.description}</p>
                          )}
                          <div className="text-primary font-medium">₹{item.price}</div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <button 
                            onClick={() => handleOpenEdit(item)}
                            className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Edit Item"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleOpenDelete(item)}
                            className="p-2 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      <MenuModal 
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        onSave={handleSaveItem}
        item={selectedItem}
        categories={categories}
      />

      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        item={selectedItem}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategories}
      />
    </div>
  );
}
