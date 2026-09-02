import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Plus, Trash2, Calendar, FileText, IndianRupee } from 'lucide-react';
import { InventoryRecord, InventoryItemLine } from '../../store/slices/inventorySlice';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  record?: InventoryRecord | null;
}

interface FormItemLine {
  name: string;
  quantity: string;
  perItemPrice: string;
  totalPrice: string;
}

export default function InventoryModal({ isOpen, onClose, onSave, record }: InventoryModalProps) {
  const getTodayStr = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  };

  const [date, setDate] = useState(getTodayStr());
  const [items, setItems] = useState<FormItemLine[]>([
    { name: '', quantity: '1', perItemPrice: '', totalPrice: '' }
  ]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (record) {
      const recordDate = record.date ? new Date(record.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) : getTodayStr();
      setDate(recordDate);
      setNotes(record.notes || '');

      const lines = Array.isArray(record.metaInfo) && record.metaInfo.length > 0
        ? record.metaInfo.map((i: InventoryItemLine) => ({
            name: i.name || '',
            quantity: String(i.quantity ?? 1),
            perItemPrice: String(i.perItemPrice ?? 0),
            totalPrice: String(i.totalPrice ?? (Number(i.quantity) * Number(i.perItemPrice))),
          }))
        : [{ name: '', quantity: '1', perItemPrice: '', totalPrice: '' }];

      setItems(lines);
    } else {
      setDate(getTodayStr());
      setNotes('');
      setItems([{ name: '', quantity: '1', perItemPrice: '', totalPrice: '' }]);
    }
    setFormError('');
  }, [record, isOpen]);

  const handleItemChange = (index: number, field: keyof FormItemLine, value: string) => {
    const updated = [...items];
    updated[index][field] = value;

    // Auto calculate item total price when quantity or perItemPrice changes
    if (field === 'quantity' || field === 'perItemPrice') {
      const qty = parseFloat(updated[index].quantity) || 0;
      const price = parseFloat(updated[index].perItemPrice) || 0;
      if (qty > 0 && price >= 0) {
        updated[index].totalPrice = (qty * price).toFixed(2);
      }
    }

    setItems(updated);
  };

  const handleAddItemRow = () => {
    setItems(prev => [...prev, { name: '', quantity: '1', perItemPrice: '', totalPrice: '' }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) {
      setItems([{ name: '', quantity: '1', perItemPrice: '', totalPrice: '' }]);
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Grand total calculation
  const grandTotal = items.reduce((sum, item) => {
    const rowTotal = parseFloat(item.totalPrice) || ((parseFloat(item.quantity) || 0) * (parseFloat(item.perItemPrice) || 0));
    return sum + (isNaN(rowTotal) ? 0 : rowTotal);
  }, 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');

    if (!date) {
      setFormError('Please select a date.');
      return;
    }

    const validItems: InventoryItemLine[] = [];
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      if (!row.name.trim()) {
        setFormError(`Please enter item name for row #${i + 1}`);
        return;
      }
      const qty = parseFloat(row.quantity);
      if (isNaN(qty) || qty <= 0) {
        setFormError(`Please enter a valid quantity (> 0) for row #${i + 1}`);
        return;
      }
      const price = parseFloat(row.perItemPrice);
      if (isNaN(price) || price < 0) {
        setFormError(`Please enter a valid price for row #${i + 1}`);
        return;
      }

      const rowTotal = parseFloat(row.totalPrice) || Number((qty * price).toFixed(2));

      validItems.push({
        name: row.name.trim(),
        quantity: qty,
        perItemPrice: price,
        totalPrice: rowTotal,
      });
    }

    if (validItems.length === 0) {
      setFormError('Please add at least one item.');
      return;
    }

    try {
      setFormLoading(true);
      const payload = {
        date,
        items: validItems,
        totalPrice: Number(grandTotal.toFixed(2)),
        notes: notes.trim() || null,
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setFormError(err || 'Failed to save inventory record');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="w-full max-w-2xl my-8 bg-surface border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[90vh]"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-white/[0.02] shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="text-primary" size={22} />
                  {record ? 'Edit Inventory Record' : 'New Inventory Record'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Log inventory purchases, quantities, and item costs.</p>
              </div>
              <button 
                type="button" 
                className="bg-transparent border-none text-slate-400 hover:text-slate-200 cursor-pointer p-1.5 rounded-lg hover:bg-white/5 transition-colors" 
                onClick={onClose}
              >
                <X size={22} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Date & Quick Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Calendar size={14} className="text-primary" /> Inventory Date
                    </label>
                    <input 
                      type="date" 
                      required
                      className="w-full bg-black/20 border border-white/10 text-slate-200 px-4 py-2.5 rounded-xl font-sans text-sm transition-all duration-200 outline-none focus:border-primary [color-scheme:dark]" 
                      value={date} 
                      onChange={e => setDate(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <IndianRupee size={14} className="text-emerald-400" /> Total Price
                    </label>
                    <div className="w-full bg-black/40 border border-emerald-500/20 text-emerald-400 font-bold px-4 py-2.5 rounded-xl font-mono text-base flex items-center">
                      ₹{grandTotal.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Items Line Items Section (Fixed Scrollable Window) */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Purchased Items ({items.length})
                    </label>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg border border-primary/20 transition-all cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Add Item</span>
                    </button>
                  </div>

                  {/* Fixed window with vertical scroll */}
                  <div className="space-y-2.5 max-h-[260px] sm:max-h-[280px] overflow-y-auto pr-1.5 focus:outline-none rounded-xl">
                    {items.map((item, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-black/20 border border-white/10 rounded-xl space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3 transition-all hover:border-white/20"
                      >
                        {/* Item Name */}
                        <div className="flex-1">
                          <label className="block text-[11px] font-medium text-slate-400 mb-1 sm:hidden">Item Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Water, Tomato, Oil"
                            className="w-full bg-black/40 border border-white/10 text-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-primary"
                            value={item.name}
                            onChange={e => handleItemChange(index, 'name', e.target.value)}
                          />
                        </div>

                        {/* Quantity */}
                        <div className="w-full sm:w-24">
                          <label className="block text-[11px] font-medium text-slate-400 mb-1 sm:hidden">Qty</label>
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            placeholder="Qty"
                            className="w-full bg-black/40 border border-white/10 text-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-primary text-center"
                            value={item.quantity}
                            onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                          />
                        </div>

                        {/* Per Item Price */}
                        <div className="w-full sm:w-28">
                          <label className="block text-[11px] font-medium text-slate-400 mb-1 sm:hidden">Rate (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Rate ₹"
                            className="w-full bg-black/40 border border-white/10 text-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-primary text-right"
                            value={item.perItemPrice}
                            onChange={e => handleItemChange(index, 'perItemPrice', e.target.value)}
                          />
                        </div>

                        {/* Row Total */}
                        <div className="w-full sm:w-28 flex items-center justify-between sm:justify-end gap-2">
                          <span className="text-[11px] text-slate-400 sm:hidden">Total:</span>
                          <span className="font-mono text-sm font-semibold text-emerald-400">
                            ₹{item.totalPrice || ((parseFloat(item.quantity) || 0) * (parseFloat(item.perItemPrice) || 0)).toFixed(2)}
                          </span>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(index)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors self-end sm:self-center cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Notes / Vendor Remarks (Optional)
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. Purchased from local market, Bill #1234, cash payment"
                    className="w-full bg-black/20 border border-white/10 text-slate-200 px-4 py-2 rounded-xl font-sans text-sm transition-all duration-200 outline-none focus:border-primary resize-none"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-medium text-center">
                    {formError}
                  </div>
                )}
              </div>

              {/* Fixed Footer Actions - Always visible */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-white/10 bg-white/[0.02] shrink-0">
                <div className="text-sm text-slate-400">
                  Total Items: <span className="font-bold text-slate-200">{items.length}</span>
                </div>
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    className="px-5 py-2.5 rounded-xl font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border border-white/10 bg-transparent text-slate-300 hover:bg-white/5" 
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border-none bg-primary text-white shadow-[0_4px_14px_0_var(--color-primary-light)] hover:bg-primary-hover disabled:opacity-50" 
                    disabled={formLoading}
                  >
                    {formLoading && <Loader2 className="animate-spin" size={16} />}
                    {formLoading ? 'Saving...' : record ? 'Update Record' : 'Save Record'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
