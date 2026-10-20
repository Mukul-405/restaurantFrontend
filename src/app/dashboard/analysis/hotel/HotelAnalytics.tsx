import React from 'react';
import { motion } from 'framer-motion';
import { BookingAnalysisSection } from './components/BookingAnalysisSection';
import { ChannelBreakdownSection } from './components/ChannelBreakdownSection';

export const HotelAnalytics: React.FC = () => {
  return (
    <motion.div
      key="hotel-analytics-tab"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 sm:space-y-8"
    >
      <BookingAnalysisSection />
      <ChannelBreakdownSection />
    </motion.div>
  );
};

export default HotelAnalytics;
