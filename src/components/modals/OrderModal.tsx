import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Plus, Trash2, Search, ChevronDown, RefreshCw, Sparkles, Tag, Check } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createOrder, updateOrder, Order, OrderItem } from '../../store/slices/orderSlice';
import { fetchMenu } from '../../store/slices/menuSlice';
import { matchesMenuSearch } from '../../utils/menuSearch';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  orderToEdit?: Order | null;
}

interface SelectedItem {
  menuItemId?: number | null;
  quantity: number;
  name: string;
  price: number;
  isCustom?: boolean;
}

export default function OrderModal({ isOpen, onClose, onSuccess, orderToEdit }: OrderModalProps) {
  const dispatch = useAppDispatch();
  const { items: menuItems, categories, status: menuStatus, error: menuError } = useAppSelector(state => state.menu);

  const [tableNumber, setTableNumber] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Custom Item Form State
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState('1');
  const [customFormError, setCustomFormError] = useState('');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchMenu());
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (isOpen) {
      if (orderToEdit) {
        setTableNumber(orderToEdit.tableNumber ? orderToEdit.tableNumber.toString() : '');
        setSelectedItems(orderToEdit.items.map(i => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          name: i.name,
          price: Number(i.price),
          isCustom: !i.menuItemId || i.menuItemId <= 0,
        })));
      } else {
        setTableNumber('');
        setSelectedItems([]);
      }
      setError(null);
      setSearchQuery('');
      setSelectedCategory('ALL');
      setCategorySearchQuery('');
      setIsCategoryDropdownOpen(false);
      setShowCustomForm(false);
      setCustomName('');
      setCustomPrice('');
      setCustomQty('1');
      setCustomFormError('');
    }
  }, [isOpen, orderToEdit]);

  // Standard menu item selection
  const handleAddItem = (menuItemId: number) => {
    const item = menuItems.find(i => Number(i.id) === menuItemId);
    if (!item) return;

    const existing = selectedItems.find(i => i.menuItemId === menuItemId);
    if (existing) {
      setSelectedItems(selectedItems.map(i => 
        i.menuItemId === menuItemId ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setSelectedItems([...selectedItems, {
        menuItemId: Number(item.id),
        quantity: 1,
        name: item.name,
        price: Number(item.price),
        isCustom: false
      }]);
    }
  };

  // Custom ad-hoc item addition
  const handleAddCustomItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCustomFormError('');

    const trimmed = customName.trim();
    if (!trimmed) {
      setCustomFormError('Please enter item name');
      return;
    }
    const parsedPrice = parseFloat(customPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setCustomFormError('Please enter a valid price (₹)');
      return;
    }
    const parsedQty = parseInt(customQty, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setCustomFormError('Please enter a valid quantity');
      return;
    }

    const existingIndex = selectedItems.findIndex(i => i.name.toLowerCase() === trimmed.toLowerCase());
    if (existingIndex !== -1) {
      setSelectedItems(selectedItems.map((item, idx) => 
        idx === existingIndex 
          ? { ...item, quantity: item.quantity + parsedQty, price: parsedPrice } 
          : item
      ));
    } else {
      const customId = -Date.now();
      setSelectedItems(prev => [...prev, {
        menuItemId: customId,
        name: trimmed,
        price: parsedPrice,
        quantity: parsedQty,
        isCustom: true
      }]);
    }

    setCustomName('');
    setCustomPrice('');
    setCustomQty('1');
    setCustomFormError('');
    setShowCustomForm(false);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    if (quantity < 1) return;
    setSelectedItems(selectedItems.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ));
  };

  const handlePriceChange = (index: number, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    setSelectedItems(selectedItems.map((item, i) => 
      i === index ? { ...item, price: newPrice } : item
    ));
  };

  const customItemsInCart = selectedItems.filter(i => i.isCustom || (i.menuItemId && i.menuItemId <= 0));

  const visibleMenuItems = menuItems.filter(item => {
    if (!matchesMenuSearch(item, searchQuery)) return false;
    if (selectedCategory === 'CART' || selectedCategory === 'CUSTOM') return false;
    return selectedCategory === 'ALL' || item.categoryName === selectedCategory;
  });

  const baseAmount = Number(selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2));
  const gstAmount = Number((baseAmount * 0.05).toFixed(2));
  const calculatedTotalAmount = Math.round(baseAmount + gstAmount);
  const discountAmount = orderToEdit?.discountAmount ? Number(orderToEdit.discountAmount) : 0;
  const finalDiscountedAmount = Math.max(0, Math.round(baseAmount + gstAmount - discountAmount));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setError('Please add at least one item');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Format items payload ensuring valid numbers
    const payloadItems = selectedItems.map(item => ({
      menuItemId: item.menuItemId && item.menuItemId > 0 ? item.menuItemId : 0,
      quantity: item.quantity,
      name: item.name.trim(),
      price: item.price,
    }));

    try {
      if (orderToEdit) {
        await dispatch(updateOrder({
          id: orderToEdit.id,
          data: {
            items: payloadItems as any,
            baseAmount,
            gstAmount,
            discountAmount,
            finalDiscountedAmount,
            tableNumber: tableNumber ? parseInt(tableNumber, 10) : undefined
          }
        })).unwrap();
      } else {
        await dispatch(createOrder({
          items: payloadItems as any,
          baseAmount,
          gstAmount,
          discountAmount,
          finalDiscountedAmount,
          tableNumber: tableNumber ? parseInt(tableNumber, 10) : undefined
        })).unwrap();
      }
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-surface border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 md:p-6 border-b border-white/10 bg-surface/80 backdrop-blur-md sticky top-0 z-20">
            <h2 className="text-xl font-bold text-slate-100">{orderToEdit ? 'Edit Order' : 'New Order'}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-white/5 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
            <div className="p-4 md:p-6 space-y-5 flex-1">
              {error && (
                <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
                  {error}
                </div>
              )}

              {/* Table Details & Custom Item Quick Toggle */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex-1 bg-black/20 border border-white/5 rounded-2xl p-2.5">
                  <input
                    type="number"
                    value={tableNumber || ''}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full bg-transparent border border-white/10 text-slate-200 px-3.5 py-2 rounded-xl font-sans text-sm transition-all duration-300 outline-none focus:border-primary placeholder-slate-500"
                    placeholder="Table Number (Optional)"
                    min="1"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowCustomForm(!showCustomForm)}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    showCustomForm 
                      ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                      : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border-purple-500/30'
                  }`}
                >
                  <Sparkles size={15} />
                  <span>{showCustomForm ? 'Close Custom Item' : '+ Add Custom Item'}</span>
                </button>
              </div>

              {/* Custom Item Form Card */}
              <AnimatePresence>
                {showCustomForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <form onSubmit={handleAddCustomItem} className="bg-purple-500/[0.07] border border-purple-500/30 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Tag size={13} /> Custom / Off-Menu Item
                        </span>
                        <span className="text-[11px] text-slate-400">Add ad-hoc item with custom name & rate</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <div className="sm:col-span-6">
                          <input
                            type="text"
                            placeholder="Item Name (e.g. Ice Cream, Mineral Water)"
                            value={customName}
                            onChange={e => setCustomName(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 text-slate-200 px-3.5 py-2 rounded-xl text-sm outline-none focus:border-purple-400 placeholder-slate-500"
                            autoFocus
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Price ₹"
                            value={customPrice}
                            onChange={e => setCustomPrice(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 text-slate-200 px-3 py-2 rounded-xl text-sm outline-none focus:border-purple-400 placeholder-slate-500 text-right"
                          />
                        </div>

                        <div className="sm:col-span-3 flex gap-2">
                          <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={customQty}
                            onChange={e => setCustomQty(e.target.value)}
                            className="w-16 bg-black/40 border border-white/10 text-slate-200 px-2 py-2 rounded-xl text-sm outline-none focus:border-purple-400 text-center"
                          />
                          <button
                            type="submit"
                            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold px-3 py-2 transition-all flex items-center justify-center gap-1 shadow-[0_2px_10px_rgba(168,85,247,0.3)] cursor-pointer"
                          >
                            <Check size={14} />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>

                      {customFormError && (
                        <div className="text-xs text-danger font-medium">{customFormError}</div>
                      )}
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Order Items Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-bold text-slate-200">Select Items</h3>
                </div>
                
                {/* Search */}
                <div className="relative mb-3.5">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search menu items..."
                    className="w-full bg-black/20 border border-white/10 text-slate-200 pl-11 pr-4 py-2.5 rounded-xl font-sans text-sm outline-none focus:border-primary placeholder-slate-500"
                  />
                </div>

                {/* Categories Horizontal Scroll */}
                <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-4 pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                  {/* Cart Tab */}
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('CART')}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      selectedCategory === 'CART' ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                    }`}
                  >
                    <span>Cart</span>
                    {selectedItems.length > 0 && (
                      <span className="bg-emerald-700 text-white px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
                        {selectedItems.reduce((acc, item) => acc + item.quantity, 0)}
                      </span>
                    )}
                  </button>

                  {/* Custom Items Tab */}
                  {customItemsInCart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('CUSTOM')}
                      className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                        selectedCategory === 'CUSTOM' ? 'bg-purple-600 text-white' : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20'
                      }`}
                    >
                      <Sparkles size={12} />
                      <span>Custom ({customItemsInCart.length})</span>
                    </button>
                  )}

                  {/* All Menu Items Tab */}
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('ALL')}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      selectedCategory === 'ALL' ? 'bg-primary text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    All
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                        selectedCategory === cat.name ? 'bg-primary text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Loading state */}
                {menuStatus === 'loading' && menuItems.length === 0 && (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-primary" size={28} />
                  </div>
                )}

                {/* Menu load error */}
                {menuStatus === 'failed' && (
                  <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-danger/20 bg-danger/10 p-3">
                    <p className="text-danger text-sm">
                      {menuItems.length > 0
                        ? 'Menu may be out of date — refresh failed.'
                        : menuError || 'Failed to load menu'}
                    </p>
                    <button
                      type="button"
                      onClick={() => dispatch(fetchMenu())}
                      className="flex shrink-0 items-center gap-2 text-primary hover:text-primary-hover text-sm cursor-pointer"
                    >
                      <RefreshCw size={16} />
                      <span>Retry</span>
                    </button>
                  </div>
                )}

                {/* View 1: Cart View (Shows all selected items: menu & custom) */}
                {selectedCategory === 'CART' && (
                  <>
                    {selectedItems.length === 0 ? (
                      <p className="py-10 text-center text-sm text-slate-400">Your cart is empty. Add menu items or custom items.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedItems.map((item, index) => {
                          if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
                            return null;
                          }
                          return (
                            <div key={`cart-${index}`} className="bg-[#24262b] border border-white/5 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                              <div className="flex-1 min-w-0 pr-3">
                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                  <h4 className="text-slate-200 font-medium text-sm sm:text-base leading-snug break-words" title={item.name}>{item.name}</h4>
                                  {item.isCustom && (
                                    <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                                      Custom
                                    </span>
                                  )}
                                </div>
                                <div className="text-emerald-400 font-bold tracking-wide text-sm">
                                  ₹{item.price}
                                  {item.quantity > 1 && (
                                    <span className="text-xs text-slate-400 font-normal ml-1.5">
                                      (₹{(item.price * item.quantity).toFixed(2)})
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                <div className="flex items-center gap-2 sm:gap-3 bg-black/30 rounded-full px-2 py-1">
                                  <button
                                    type="button"
                                    onClick={() => handleQuantityChange(index, item.quantity - 1)}
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-200 hover:bg-white/20 active:scale-95 transition-all cursor-pointer font-bold text-sm"
                                  >-</button>
                                  <span className="w-4 text-center font-bold text-slate-100 text-sm">{item.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleQuantityChange(index, item.quantity + 1)}
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-200 hover:bg-white/20 active:scale-95 transition-all cursor-pointer font-bold text-sm"
                                  >+</button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="text-danger/80 hover:text-danger p-1.5 sm:p-2 transition-colors cursor-pointer"
                                  title="Remove item"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* View 2: Custom Items Tab */}
                {selectedCategory === 'CUSTOM' && (
                  <>
                    {customItemsInCart.length === 0 ? (
                      <p className="py-10 text-center text-sm text-slate-400">No custom items added yet. Click "+ Add Custom Item" above to add one.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedItems.map((item, index) => {
                          if (!item.isCustom && (!item.menuItemId || item.menuItemId > 0)) return null;
                          if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
                            return null;
                          }
                          return (
                            <div key={`custom-${index}`} className="bg-[#24262b] border border-purple-500/20 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                              <div className="flex-1 min-w-0 pr-3">
                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                  <h4 className="text-slate-200 font-medium text-sm sm:text-base leading-snug break-words" title={item.name}>{item.name}</h4>
                                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                                    Custom
                                  </span>
                                </div>
                                <div className="text-emerald-400 font-bold tracking-wide text-sm">
                                  ₹{item.price}
                                  {item.quantity > 1 && (
                                    <span className="text-xs text-slate-400 font-normal ml-1.5">
                                      (₹{(item.price * item.quantity).toFixed(2)})
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                <div className="flex items-center gap-2 sm:gap-3 bg-black/30 rounded-full px-2 py-1">
                                  <button
                                    type="button"
                                    onClick={() => handleQuantityChange(index, item.quantity - 1)}
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-200 hover:bg-white/20 active:scale-95 transition-all cursor-pointer font-bold text-sm"
                                  >-</button>
                                  <span className="w-4 text-center font-bold text-slate-100 text-sm">{item.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleQuantityChange(index, item.quantity + 1)}
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-200 hover:bg-white/20 active:scale-95 transition-all cursor-pointer font-bold text-sm"
                                  >+</button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="text-danger/80 hover:text-danger p-1.5 sm:p-2 transition-colors cursor-pointer"
                                  title="Remove item"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* View 3: Standard Menu Items Grid */}
                {selectedCategory !== 'CART' && selectedCategory !== 'CUSTOM' && (
                  <>
                    {menuStatus === 'succeeded' && menuItems.length > 0 && visibleMenuItems.length === 0 && (
                      <p className="py-10 text-center text-sm text-slate-400">
                        No menu items match this search or category.
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {visibleMenuItems.map((item) => {
                        const selectedItemIndex = selectedItems.findIndex(s => s.menuItemId === Number(item.id));
                        const selectedItem = selectedItemIndex !== -1 ? selectedItems[selectedItemIndex] : null;
                        const qty = selectedItem?.quantity || 0;

                        return (
                          <div key={item.id} className="bg-[#24262b] border border-white/5 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                            <div className="flex-1 min-w-0 pr-3">
                              <h4 className="text-slate-200 font-medium text-sm sm:text-base mb-1 leading-snug break-words" title={item.name}>
                                {item.name}
                                {!item.isAvailable && (
                                  <span className="ml-2 text-[10px] uppercase tracking-wider text-amber-400/90 font-semibold inline-block">Unavailable</span>
                                )}
                              </h4>
                              <div className="text-emerald-400 font-bold tracking-wide text-sm">₹{item.price}</div>
                            </div>
                            
                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                              {qty > 0 ? (
                                <>
                                  <div className="flex items-center gap-2 sm:gap-3 bg-black/30 rounded-full px-2 py-1">
                                    <button
                                      type="button"
                                      onClick={() => handleQuantityChange(selectedItemIndex, qty - 1)}
                                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-200 hover:bg-white/20 active:scale-95 transition-all cursor-pointer font-bold text-sm"
                                    >-</button>
                                    <span className="w-4 text-center font-bold text-slate-100 text-sm">{qty}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleQuantityChange(selectedItemIndex, qty + 1)}
                                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-200 hover:bg-white/20 active:scale-95 transition-all cursor-pointer font-bold text-sm"
                                    >+</button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(selectedItemIndex)}
                                    className="text-danger/80 hover:text-danger p-1.5 sm:p-2 transition-colors cursor-pointer"
                                    title="Remove item"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddItem(Number(item.id))}
                                  disabled={!item.isAvailable}
                                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                    item.isAvailable 
                                      ? 'bg-primary/20 text-primary hover:bg-primary/30 active:scale-95' 
                                      : 'bg-white/5 text-slate-600 cursor-not-allowed'
                                  }`}
                                >
                                  <Plus size={20} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Sticky Totals Footer */}
            {selectedItems.length > 0 && (
              <div className="sticky bottom-0 bg-[#1c1e23] border-t border-white/10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] z-20">
                <div className="p-4 md:p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center px-2">
                    <div className="text-center">
                      <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Subtotal</div>
                      <div className="text-emerald-400 font-bold text-lg">₹{baseAmount.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Tax (5%)</div>
                      <div className="text-emerald-400 font-bold text-lg">₹{gstAmount.toFixed(2)}</div>
                    </div>
                    {(() => {
                      const raw = baseAmount + gstAmount;
                      const roundOff = Number((calculatedTotalAmount - raw).toFixed(2));
                      return (
                        <div className="text-center">
                          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Round Off</div>
                          <div className={`font-bold text-lg ${roundOff !== 0 ? "text-amber-400 font-mono" : "text-slate-300 font-mono"}`}>
                            {roundOff > 0 ? `+₹${roundOff.toFixed(2)}` : roundOff < 0 ? `-₹${Math.abs(roundOff).toFixed(2)}` : '₹0.00'}
                          </div>
                        </div>
                      );
                    })()}
                    <div className="text-center">
                      <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Total</div>
                      <div className="text-emerald-400 font-black text-xl">₹{calculatedTotalAmount}</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl font-bold text-base transition-all duration-200 border-none bg-primary text-white hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_4px_14px_0_var(--color-primary-light)] cursor-pointer"
                  >
                    {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                    {orderToEdit ? 'Save Changes' : 'Submit Order'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
