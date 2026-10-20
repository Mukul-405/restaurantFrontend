import React from 'react';
import { motion } from 'framer-motion';

export interface StatCardProps {
  title: string;
  value: string;
  icon: any;
  color: string;
  highlight?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  highlight = false,
  className = '',
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative overflow-hidden ${
      highlight
        ? 'bg-gradient-to-br from-emerald-500/15 via-surface/60 to-surface/40 border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.15)]'
        : 'bg-surface/40 border-white/10 shadow-lg'
    } backdrop-blur-md p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${className}`}
  >
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${color} blur-2xl pointer-events-none`} />
    <div className="flex justify-between items-start mb-3">
      <h3 className="text-slate-400 font-medium text-xs sm:text-sm">{title}</h3>
      <div className={`p-2 rounded-xl bg-surface/50 shrink-0 ${color.replace('bg-', 'text-')}`}>
        <Icon size={18} className="sm:w-5 sm:h-5" />
      </div>
    </div>
    <div className={`text-xl sm:text-2xl font-bold ${highlight ? 'text-emerald-400' : 'text-white'} tracking-tight truncate`} title={value}>
      {value}
    </div>
  </motion.div>
);
