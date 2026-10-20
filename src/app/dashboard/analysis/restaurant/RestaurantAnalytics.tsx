import React from 'react';
import { motion } from 'framer-motion';
import { DailyBillSummarySection } from './components/DailyBillSummarySection';
import { RevenueAnalysisSection } from './components/RevenueAnalysisSection';
import { OrderItemsSection } from './components/OrderItemsSection';
import { WaiterSection } from './components/WaiterSection';

export const RestaurantAnalytics: React.FC = () => {
  return (
    <motion.div
      key="restaurant-analytics-tab"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 sm:space-y-8"
    >
      <DailyBillSummarySection />
      <RevenueAnalysisSection />
      <OrderItemsSection />
      <WaiterSection />
    </motion.div>
  );
};

export default RestaurantAnalytics;
