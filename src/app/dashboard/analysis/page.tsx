'use client';

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Hotel, UtensilsCrossed } from 'lucide-react';
import HotelAnalytics from './hotel/HotelAnalytics';
import RestaurantAnalytics from './restaurant/RestaurantAnalytics';

export default function AnalysisPage() {
  const [activeCategory, setActiveCategory] = useState<'HOTEL' | 'RESTAURANT'>('HOTEL');

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12 px-1 sm:px-0">
      {/* Header & Section Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
            Analytics Dashboard
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            {activeCategory === 'HOTEL'
              ? 'Gain insights into hotel room revenue, bookings, and channel breakdown.'
              : 'Gain insights into restaurant revenue, ordered items sales, and staff performance.'}
          </p>
        </div>

        {/* Category Option Selector */}
        <div className="grid grid-cols-2 w-full sm:w-auto bg-surface/50 p-1.5 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md shrink-0">
          <button
            onClick={() => setActiveCategory('HOTEL')}
            className={`flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeCategory === 'HOTEL'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Hotel size={16} className="shrink-0" />
            <span className="truncate">Hotel Analytics</span>
          </button>
          <button
            onClick={() => setActiveCategory('RESTAURANT')}
            className={`flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeCategory === 'RESTAURANT'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <UtensilsCrossed size={16} className="shrink-0" />
            <span className="truncate">Restaurant Analytics</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeCategory === 'HOTEL' && <HotelAnalytics />}
        {activeCategory === 'RESTAURANT' && <RestaurantAnalytics />}
      </AnimatePresence>
    </div>
  );
}
