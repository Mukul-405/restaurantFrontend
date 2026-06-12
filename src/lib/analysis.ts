import api from './api';

export interface RevenueAnalysis {
  totalBaseAmount: string;
  totalGstAmount: string;
  totalFinalDiscountedAmount: string;
}

export interface WaiterAnalysis {
  userId: string;
  waiterName: string;
  phoneNumber: string;
  totalOrders: number;
  totalRevenue: string;
}

export const getRevenueAnalysis = async (startDate: string, endDate: string): Promise<RevenueAnalysis> => {
  const { data } = await api.get('/analysis/revenue', { params: { startDate, endDate } });
  return data;
};

export const getWaiterAnalysis = async (startDate: string, endDate: string): Promise<WaiterAnalysis[]> => {
  const { data } = await api.get('/analysis/waiter', { params: { startDate, endDate } });
  return data;
};
