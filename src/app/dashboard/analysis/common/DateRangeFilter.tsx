import React from 'react';
import { motion } from 'framer-motion';
import { Printer, Download, AlertCircle } from 'lucide-react';

export interface DateRangeFilterProps {
  title: string;
  icon: any;
  color: {
    bgLight: string;
    text: string;
    bgHover: string;
    border: string;
  };
  iconColor: string;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  onGenerate: () => void;
  loading: boolean;
  setDateRangeType: (type: 'today' | 'yesterday' | '7days' | 'month') => void;
  error?: string | null;
  onDownload?: (() => void) | null;
  onPrint?: (() => void) | null;
  hasData?: boolean;
  dateNote?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  title,
  icon: Icon,
  color,
  iconColor,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onGenerate,
  loading,
  setDateRangeType,
  error,
  onDownload,
  onPrint,
  hasData,
  dateNote,
}) => (
  <div className="space-y-4">
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface/30 p-4 sm:p-5 rounded-2xl border border-white/5 shadow-md">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${color.bgLight} ${iconColor} border ${color.border} shrink-0`}>
          <Icon size={20} className="sm:w-5 sm:h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-xl font-bold text-slate-100">{title}</h2>
            {dateNote && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                {dateNote}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
            <label className="text-[11px] sm:text-xs text-slate-400 font-medium">Start:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onClick={(e) => (e.target as any).showPicker?.()}
              className="w-full sm:w-auto bg-surface/50 border border-white/10 text-white text-xs sm:text-sm rounded-lg focus:ring-primary focus:border-primary p-2 sm:p-2.5 transition-all outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
            <label className="text-[11px] sm:text-xs text-slate-400 font-medium">End:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              onClick={(e) => (e.target as any).showPicker?.()}
              className="w-full sm:w-auto bg-surface/50 border border-white/10 text-white text-xs sm:text-sm rounded-lg focus:ring-primary focus:border-primary p-2 sm:p-2.5 transition-all outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-1 sm:pt-0">
          {hasData && (
            <>
              {onPrint && (
                <button
                  onClick={onPrint}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 text-white hover:bg-white/10 border border-white/10 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer"
                  title="Print Report"
                >
                  <Printer size={15} />
                  <span>Print</span>
                </button>
              )}
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 text-white hover:bg-white/10 border border-white/10 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer"
                  title="Download PDF"
                >
                  <Download size={15} />
                  <span>PDF</span>
                </button>
              )}
            </>
          )}
          <button
            onClick={onGenerate}
            disabled={loading}
            className={`w-full sm:w-auto px-5 py-2 ${color.bgLight} ${color.text} hover:${color.bgHover} border ${color.border} rounded-lg text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center shadow-sm cursor-pointer`}
          >
            {loading ? 'Loading...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 -mt-2">
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2">
        <button onClick={() => setDateRangeType('today')} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10 text-center cursor-pointer">Today</button>
        <button onClick={() => setDateRangeType('yesterday')} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10 text-center cursor-pointer">Yesterday</button>
        <button onClick={() => setDateRangeType('7days')} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10 text-center cursor-pointer">Last 7 Days</button>
        <button onClick={() => setDateRangeType('month')} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10 text-center cursor-pointer">This Month</button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-medium"
        >
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}
    </div>
  </div>
);
