import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Plus, Trash2, Tag, Sparkles, Building2 } from 'lucide-react';
import { printBookingBill, BookingBillCustomField } from '../../utils/printReceipt';

interface PrintBookingBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  roomDiscount?: number;
  foodDiscount?: number;
}

interface KeyValueRow {
  id: string;
  key: string;
  value: string;
}

const COMMON_PRESETS = [
  { key: 'Bill To', placeholder: 'e.g. Microsoft Company Limited' },
  { key: 'Guest / Company GSTIN', placeholder: 'e.g. 08AFAFS7077J1ZI' },
  { key: 'Billing Address', placeholder: 'e.g. DLF Cyber City, Gurugram' },
  { key: 'PO / Ref Number', placeholder: 'e.g. PO #10948' },
  { key: 'Company PAN', placeholder: 'e.g. ABCDE1234F' }
];

export default function PrintBookingBillModal({
  isOpen,
  onClose,
  booking,
  roomDiscount = 0,
  foodDiscount = 0
}: PrintBookingBillModalProps) {
  const [fields, setFields] = useState<KeyValueRow[]>([
    { id: 'row-1', key: 'Bill To', value: '' }
  ]);

  useEffect(() => {
    if (isOpen && booking) {
      setFields([
        { id: 'row-1', key: 'Bill To', value: '' }
      ]);
    }
  }, [isOpen, booking]);

  if (!isOpen || !booking) return null;

  const handleAddField = (presetKey: string = '', presetPlaceholder: string = '') => {
    setFields(prev => [
      ...prev,
      { id: `row-${Date.now()}-${Math.random()}`, key: presetKey, value: '' }
    ]);
  };

  const handleUpdateField = (id: string, field: 'key' | 'value', text: string) => {
    setFields(prev => prev.map(row => row.id === id ? { ...row, [field]: text } : row));
  };

  const handleRemoveField = (id: string) => {
    setFields(prev => prev.filter(row => row.id !== id));
  };

  const handlePrint = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Filter out rows that have empty keys AND values
    const validFields: BookingBillCustomField[] = fields
      .filter(row => row.key.trim() && row.value.trim())
      .map(row => ({
        key: row.key.trim(),
        value: row.value.trim()
      }));

    printBookingBill(booking, roomDiscount, foodDiscount, validFields);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-surface border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 md:p-5 border-b border-white/10 bg-surface/90 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                <Printer size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">Print Bill Options</h2>
                <p className="text-xs text-slate-400">Add, edit, or remove custom billing key-value details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-white/5"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handlePrint} className="p-5 md:p-6 overflow-y-auto custom-scrollbar space-y-5">
            {/* Booking Summary Pill */}
            <div className="bg-black/30 border border-white/10 rounded-xl p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white font-mono">Booking #{booking.bookingId}</span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-slate-200 font-semibold">{booking.guestName || 'Guest'}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                booking.paymentStatus === 'PAID'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {booking.paymentStatus}
              </span>
            </div>

            {/* Quick Presets Suggestions */}
            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" /> Quick Add Suggestions
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_PRESETS.map((preset, idx) => {
                  const alreadyExists = fields.some(f => f.key.toLowerCase() === preset.key.toLowerCase());
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddField(preset.key, preset.placeholder)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 font-medium ${
                        alreadyExists 
                          ? 'bg-white/5 text-slate-400 border-white/5 hover:border-white/20' 
                          : 'bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40'
                      }`}
                    >
                      <Plus size={12} />
                      <span>{preset.key}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Key-Value Pairs List */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Tag size={14} className="text-primary" /> Extra Bill Key-Value Fields
                </label>
                <button
                  type="button"
                  onClick={() => handleAddField('', '')}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
                >
                  <Plus size={13} /> Add Field
                </button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-black/20 text-slate-400 text-xs">
                  No custom fields added. Standard guest info will be printed.
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => handleAddField('Bill To', '')}
                      className="text-primary hover:underline font-semibold"
                    >
                      + Add a field (e.g. Bill To)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {fields.map((row, index) => (
                    <motion.div
                      key={row.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-start gap-2 bg-black/40 border border-white/10 rounded-xl p-2.5 focus-within:border-primary/50 transition-colors"
                    >
                      {/* Key Field Input */}
                      <div className="w-1/3 min-w-[110px] pt-0.5">
                        <input
                          type="text"
                          value={row.key}
                          onChange={(e) => handleUpdateField(row.id, 'key', e.target.value)}
                          placeholder="Label / Key"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>

                      <span className="text-slate-500 text-xs font-bold pt-2">:</span>

                      {/* Value Field Input */}
                      <div className="flex-1">
                        <textarea
                          rows={2}
                          value={row.value}
                          onChange={(e) => handleUpdateField(row.id, 'value', e.target.value)}
                          placeholder="Value (Press Enter for new line)"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors font-mono resize-y min-h-[38px] leading-relaxed custom-scrollbar"
                        />
                      </div>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveField(row.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0 mt-0.5"
                        title="Delete this field"
                      >
                        <Trash2 size={15} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                <Printer size={15} />
                <span>Print Bill</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
