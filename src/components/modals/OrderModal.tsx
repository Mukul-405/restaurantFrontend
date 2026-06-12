import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Plus, Trash2, Search, ChevronDown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createOrder, updateOrder, Order } from '../../store/slices/orderSlice';
import { fetchMenu } from '../../store/slices/menuSlice';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  orderToEdit?: Order | null;
}

export default function OrderModal({ isOpen, onClose, onSuccess, orderToEdit }: OrderModalProps) {
  const dispatch = useAppDispatch();
  const { items: menuItems, categories, status: menuStatus } = useAppSelector(state => state.menu);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [selectedItems, setSelectedItems] = useState<Array<{menuItemId: number, quantity: number, name: string, price: number}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    if (isOpen && menuStatus === 'idle') {
      dispatch(fetchMenu());
    }
  }, [isOpen, menuStatus, dispatch]);

  useEffect(() => {
    if (isOpen) {
      if (orderToEdit) {
        setPhoneNumber(orderToEdit.phoneNumber);
        setTableNumber(orderToEdit.tableNumber ? orderToEdit.tableNumber.toString() : '');
        setSelectedItems(orderToEdit.items.map(i => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          name: i.name,
          price: i.price
        })));
      } else {
        setPhoneNumber('');
        setTableNumber('');
        setSelectedItems([]);
      }
      setError(null);
      setSearchQuery('');
      setSelectedCategory('ALL');
      setCategorySearchQuery('');
      setIsCategoryDropdownOpen(false);
    }
  }, [isOpen, orderToEdit]);

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
        price: Number(item.price)
      }]);
    }
  };

  const handleRemoveItem = (menuItemId: number) => {
    setSelectedItems(selectedItems.filter(i => i.menuItemId !== menuItemId));
  };

  const handleQuantityChange = (menuItemId: number, quantity: number) => {
    if (quantity < 1) return;
    setSelectedItems(selectedItems.map(i => 
      i.menuItemId === menuItemId ? { ...i, quantity } : i
    ));
  };

  const handlePriceChange = (menuItemId: number, price: number) => {
    setSelectedItems(selectedItems.map(i => 
      i.menuItemId === menuItemId ? { ...i, price } : i
    ));
  };

  const baseAmount = Number(selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2));
  const gstAmount = Number((baseAmount * 0.05).toFixed(2));
  const calculatedTotalAmount = Number((baseAmount + gstAmount).toFixed(2));
  const discountAmount = 0;
  const finalDiscountedAmount = calculatedTotalAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      setError('Phone number is required');
      return;
    }
    if (selectedItems.length === 0) {
      setError('Please add at least one item');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (orderToEdit) {
        await dispatch(updateOrder({
          id: orderToEdit.id,
          data: {
            phoneNumber,
            items: selectedItems,
            baseAmount,
            gstAmount,
            discountAmount,
            finalDiscountedAmount,
            tableNumber: tableNumber ? parseInt(tableNumber, 10) : undefined
          }
        })).unwrap();
      } else {
        await dispatch(createOrder({
          phoneNumber,
          items: selectedItems,
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
          <div className="flex justify-between items-center p-4 md:p-6 border-b border-white/10 bg-surface/80 backdrop-blur-md sticky top-0 z-20">
            <h2 className="text-xl font-bold text-slate-100">{orderToEdit ? 'Edit Order' : 'New Order'}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-white/5"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
            <div className="p-4 md:p-6 space-y-6 flex-1">
              {error && (
                <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
                  {error}
                </div>
              )}

              {/* Customer Details */}
              <div>
                <h3 className="text-lg font-bold text-slate-200 mb-3">Customer Details</h3>
                <div className="bg-black/20 border border-white/5 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-transparent border border-white/10 text-slate-200 px-4 py-3 rounded-xl font-sans text-sm transition-all duration-300 outline-none focus:border-primary placeholder-slate-500"
                    placeholder="Phone Number *"
                    required
                  />
                  <input
                    type="number"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full bg-transparent border border-white/10 text-slate-200 px-4 py-3 rounded-xl font-sans text-sm transition-all duration-300 outline-none focus:border-primary placeholder-slate-500"
                    placeholder="Table Number (Optional)"
                    min="1"
                  />
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-bold text-slate-200 mb-3">Order Items</h3>
                
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search menu items..."
                    className="w-full bg-black/20 border border-white/10 text-slate-200 pl-11 pr-4 py-3 rounded-xl font-sans text-sm outline-none focus:border-primary placeholder-slate-500"
                  />
                </div>

                {/* Categories (Horizontal Scroll) */}
                <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-4 pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('CART')}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                      selectedCategory === 'CART' ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                    }`}
                  >
                    Cart
                    {selectedItems.length > 0 && (
                      <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {selectedItems.reduce((acc, item) => acc + item.quantity, 0)}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('ALL')}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
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
                      className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === cat.name ? 'bg-primary text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Item List (Grid on desktop, list on mobile) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {menuItems
                    .filter(item => {
                      if (selectedCategory === 'CART') {
                        return selectedItems.some(s => s.menuItemId === Number(item.id));
                      }
                      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesCat = selectedCategory === 'ALL' || item.categoryName === selectedCategory;
                      return matchesSearch && matchesCat;
                    })
                    .map((item) => {
                      const selectedItem = selectedItems.find(s => s.menuItemId === Number(item.id));
                      const qty = selectedItem?.quantity || 0;

                      return (
                        <div key={item.id} className="bg-[#24262b] border border-white/5 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                          <div>
                            <h4 className="text-slate-200 font-medium text-base mb-1">{item.name}</h4>
                            <div className="text-emerald-400 font-bold tracking-wide">₹{item.price}</div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {qty > 0 ? (
                              <>
                                <div className="flex items-center gap-3 bg-black/30 rounded-full px-2 py-1">
                                  <button
                                    type="button"
                                    onClick={() => handleQuantityChange(Number(item.id), qty - 1)}
                                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-200 hover:bg-white/20 active:scale-95 transition-all"
                                  >-</button>
                                  <span className="w-4 text-center font-bold text-slate-100">{qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleQuantityChange(Number(item.id), qty + 1)}
                                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-200 hover:bg-white/20 active:scale-95 transition-all"
                                  >+</button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(Number(item.id))}
                                  className="text-danger/80 hover:text-danger p-2 transition-colors"
                                >
                                  <Trash2 size={20} />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddItem(Number(item.id))}
                                disabled={!item.isAvailable}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
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
                    <div className="text-center">
                      <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Total</div>
                      <div className="text-emerald-400 font-black text-xl">₹{calculatedTotalAmount.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl font-bold text-base transition-all duration-200 border-none bg-primary text-white hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_4px_14px_0_var(--color-primary-light)]"
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
