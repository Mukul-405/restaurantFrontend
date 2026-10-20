'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, DollarSign, Calculator, Receipt, Percent, ArrowDownRight, CheckCircle2, Info } from 'lucide-react';

interface OtaDeductionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

export function calculateOtaDeductions(b: any) {
  if (!b) return null;

  let payload = b.webhookPayload;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = null;
    }
  }

  const amountObj = payload?.amount || {};
  const channel = (b.channel || payload?.channel || '').trim();
  const source = (b.source || payload?.segment || '').trim().toUpperCase();

  const lower = channel.toLowerCase();
  const isKnownOta = (
    lower.includes('booking') ||
    lower.includes('makemytrip') ||
    lower.includes('make my trip') ||
    lower.includes('mmt') ||
    lower.includes('agoda') ||
    lower.includes('goibibo') ||
    lower.includes('expedia') ||
    lower.includes('airbnb')
  );

  const isOta = source === 'OTA' || isKnownOta;

  const commission = Number(amountObj.commission ?? b.commission ?? 0);
  const tcs = Number(amountObj.tcs ?? 0);
  const tds = Number(amountObj.tds ?? 0);

  if (!isOta && commission <= 0 && tcs <= 0 && tds <= 0) {
    return null;
  }

  const grossAmount = Number(
    amountObj.amountAfterTax ?? 
    amountObj.amountBeforeTax ?? 
    b.totalAmount ?? 
    0
  );

  // GST on Commission is 18% of commission amount
  const gstOnCommission = Number((commission * 0.18).toFixed(2));
  const totalCommission = Number((commission + gstOnCommission).toFixed(2));
  const taxDeductions = Number((tcs + tds).toFixed(2));
  const totalDeductions = Number((totalCommission + taxDeductions).toFixed(2));
  const payableToProperty = Number((grossAmount - totalDeductions).toFixed(2));

  return {
    isOta: true,
    channel: channel || 'OTA',
    grossAmount,
    commission,
    gstOnCommission,
    totalCommission,
    tcs,
    tds,
    taxDeductions,
    totalDeductions,
    payableToProperty,
    currency: amountObj.currency || 'INR'
  };
}

export default function OtaDeductionsModal({ isOpen, onClose, booking }: OtaDeductionsModalProps) {
  if (!isOpen || !booking) return null;

  const deductions = calculateOtaDeductions(booking);
  if (!deductions) return null;

  const {
    channel,
    grossAmount,
    commission,
    gstOnCommission,
    totalCommission,
    tcs,
    tds,
    taxDeductions,
    totalDeductions,
    payableToProperty
  } = deductions;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#12141a] border border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-surface to-[#161922]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <Receipt size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white tracking-tight">
                    OTA Payout Breakdown
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                    <Globe size={10} />
                    {channel}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Guest: <span className="text-slate-200 font-semibold">{booking.guestName || 'Guest'}</span> • ID: <span className="font-mono text-slate-300">{booking.bookingId}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
            {/* 3 Metric Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gross Amount</div>
                <div className="text-sm font-black text-white font-mono mt-1">₹{grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">Customer Paid</div>
              </div>

              <div className="bg-rose-500/[0.05] border border-rose-500/20 rounded-2xl p-3 text-center">
                <div className="text-[10px] uppercase font-bold text-rose-300 tracking-wider">Total Deductions</div>
                <div className="text-sm font-black text-rose-400 font-mono mt-1">-₹{totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="text-[9px] text-rose-300/60 mt-0.5">Commission & Taxes</div>
              </div>

              <div className="bg-emerald-500/[0.08] border border-emerald-500/30 rounded-2xl p-3 text-center shadow-lg shadow-emerald-500/5">
                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Net Payable</div>
                <div className="text-sm font-black text-emerald-300 font-mono mt-1">₹{payableToProperty.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="text-[9px] text-emerald-400/70 mt-0.5">Property Payout</div>
              </div>
            </div>

            {/* Itemized Calculation Section */}
            <div className="bg-surface/50 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-300 pb-2 border-b border-white/10 flex items-center justify-between">
                <span>Final Calculation</span>
                <span className="text-[10px] font-bold text-slate-400">Values in INR (₹)</span>
              </div>

              {/* Group A: Gross Charges */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-slate-300 font-medium">
                  <span>1. Room Charges</span>
                  <span className="font-mono font-bold text-white">₹ {grossAmount.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>2. Property Taxes & Other Charges</span>
                  <span className="font-mono">₹ 0.0</span>
                </div>
                <div className="flex items-center justify-between text-slate-200 font-extrabold bg-white/[0.04] p-2 rounded-xl border border-white/5">
                  <span>(A) Property Gross Charges (1+2)</span>
                  <span className="font-mono text-white">₹ {grossAmount.toFixed(1)}</span>
                </div>
              </div>

              {/* Group B: Commission & GST */}
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-slate-300 font-medium">
                  <span>3. {channel} Commission</span>
                  <span className="font-mono text-rose-300">₹ {commission.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1">
                    4. GST on Commission @ 18.0%
                    <span className="text-[9px] text-slate-500">(IGST/CGST/SGST)</span>
                  </span>
                  <span className="font-mono text-rose-300">₹ {gstOnCommission.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between text-rose-300 font-extrabold bg-rose-500/[0.08] p-2 rounded-xl border border-rose-500/20">
                  <span>(B) {channel} Commission (incl. GST) (3+4)</span>
                  <span className="font-mono">₹ {totalCommission.toFixed(1)}</span>
                </div>
              </div>

              {/* Group C: Tax Deductions (TCS / TDS) */}
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-slate-300 font-medium">
                  <span>5. TCS @ 0.5%</span>
                  <span className="font-mono text-amber-300">₹ {tcs.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300 font-medium">
                  <span>6. TDS @ 0.1%</span>
                  <span className="font-mono text-amber-300">₹ {tds.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between text-amber-300 font-extrabold bg-amber-500/[0.08] p-2 rounded-xl border border-amber-500/20">
                  <span>(C) Tax Deduction (TCS + TDS) (5+6)</span>
                  <span className="font-mono">₹ {taxDeductions.toFixed(1)}</span>
                </div>
              </div>

              {/* Final Payable to Property Highlight */}
              <div className="pt-3 border-t-2 border-white/10">
                <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 border-2 border-emerald-500/40 rounded-2xl p-3.5 flex items-center justify-between shadow-xl">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      Payable to Property (A - B - C)
                    </div>
                    <div className="text-[10px] text-emerald-300/70 font-medium">
                      Net settlement amount received from {channel}
                    </div>
                  </div>
                  <div className="text-xl font-black text-emerald-300 font-mono tracking-tight">
                    ₹ {payableToProperty.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* Note box */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-[11px] text-slate-400 flex items-start gap-2">
              <Info size={14} className="text-sky-400 shrink-0 mt-0.5" />
              <span>
                GST on Commission is calculated as 18% of the platform commission. TCS and TDS deductions are deposited with the government by the OTA platform under your property GSTIN and PAN.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-surface flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
