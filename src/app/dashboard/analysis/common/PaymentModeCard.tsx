import React from 'react';
import { motion } from 'framer-motion';

export interface PaymentModeCardProps {
  title: string;
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  icon: any;
  colorClass: string;
  badgeBg: string;
  borderColor: string;
  gradientFrom: string;
  taxLabel?: string;
  commission?: number;
  roomDiscountAmount?: number;
  tds?: number;
  tcs?: number;
  finalAmount?: number;
  count?: number;
}

export const PaymentModeCard: React.FC<PaymentModeCardProps> = ({
  title,
  baseAmount,
  gstAmount,
  totalAmount,
  icon: Icon,
  colorClass,
  badgeBg,
  borderColor,
  gradientFrom,
  taxLabel = 'GST (5%)',
  commission,
  roomDiscountAmount,
  tds,
  tcs,
  finalAmount,
  count,
}) => {
  const hasExtraBreakdown =
    finalAmount !== undefined ||
    commission !== undefined ||
    roomDiscountAmount !== undefined ||
    tds !== undefined ||
    tcs !== undefined;

  const totalTaxesWithheld = (tds || 0) + (tcs || 0);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden bg-surface/40 backdrop-blur-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl border ${borderColor} flex flex-col justify-between space-y-4 sm:space-y-5 hover:shadow-2xl transition-all duration-300 group`}
    >
      <div
        className={`absolute -right-20 -top-20 w-48 h-48 bg-gradient-to-br ${gradientFrom} to-transparent opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity duration-500 pointer-events-none`}
      />

      <div className="relative z-10 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl ${badgeBg} shadow-inner`}>
            <Icon size={20} className={`${colorClass} sm:w-6 sm:h-6`} />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm sm:text-base tracking-wide">{title}</h3>
            <div className="flex items-center gap-2">
              <span className={`${colorClass} text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-80`}>
                Payment Mode
              </span>
              {count !== undefined && (
                <span className="text-[10px] text-slate-400 font-medium">
                  ({count})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 space-y-0.5">
        <span className="text-[11px] sm:text-xs text-slate-400 font-medium tracking-wide">
          Total (Base + Tax)
        </span>
        <div className="flex items-baseline gap-1">
          <span className={`text-lg sm:text-xl font-bold ${colorClass} opacity-80`}>₹</span>
          <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            {Number(totalAmount || 0).toFixed(2)}
          </span>
        </div>
      </div>

      <div
        className={`relative z-10 pt-3 sm:pt-4 border-t border-white/10 grid ${
          hasExtraBreakdown ? 'grid-cols-2 gap-2' : 'grid-cols-2 gap-2 sm:gap-3'
        } text-xs sm:text-sm`}
      >
        <div className="bg-black/30 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
          <span className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider block mb-0.5 sm:mb-1">
            Base Amount
          </span>
          <span className="text-slate-200 font-bold text-xs sm:text-sm">
            ₹{Number(baseAmount || 0).toFixed(2)}
          </span>
        </div>
        <div className="bg-black/30 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
          <span className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider block mb-0.5 sm:mb-1">
            {taxLabel}
          </span>
          <span className="text-amber-400/90 font-bold text-xs sm:text-sm">
            ₹{Number(gstAmount || 0).toFixed(2)}
          </span>
        </div>

        {hasExtraBreakdown && (
          <>
            <div className="bg-black/30 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
              <span className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider block mb-0.5 sm:mb-1">
                Discount & Comm
              </span>
              <span className="text-rose-400/90 font-bold text-xs sm:text-sm">
                ₹{Number((roomDiscountAmount || 0) + (commission || 0)).toFixed(2)}
              </span>
            </div>

            {(tds !== undefined || tcs !== undefined) && (
              <div className="bg-black/30 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
                <span className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider block mb-0.5 sm:mb-1">
                  TDS & TCS Tax
                </span>
                <span className="text-amber-300 font-bold text-xs sm:text-sm">
                  ₹{Number(totalTaxesWithheld).toFixed(2)}
                </span>
              </div>
            )}

            <div
              className={`bg-black/30 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors ${
                tds === undefined && tcs === undefined ? 'col-span-1' : 'col-span-2'
              }`}
            >
              <span className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider block mb-0.5 sm:mb-1">
                Final Amount
              </span>
              <span className="text-emerald-400 font-bold text-xs sm:text-sm">
                ₹{Number(
                  finalAmount ??
                    totalAmount -
                      (roomDiscountAmount || 0) -
                      (commission || 0) -
                      totalTaxesWithheld
                ).toFixed(2)}
              </span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
