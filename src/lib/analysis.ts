import api from './api';

export interface RevenueAnalysis {
  totalBaseAmount: number;
  totalGstAmount: number;
  totalFinalDiscountedAmount: number;
}

export interface WaiterAnalysis {
  userId: string;
  waiterName: string;
  phoneNumber: string;
  totalOrders: number;
  totalRevenue: number;
}

export const getRevenueAnalysis = async (startDate: string, endDate: string): Promise<RevenueAnalysis> => {
  const { data } = await api.get('/analysis/revenue', { params: { startDate, endDate } });
  return data;
};

export const getWaiterAnalysis = async (startDate: string, endDate: string): Promise<WaiterAnalysis[]> => {
  const { data } = await api.get('/analysis/waiter', { params: { startDate, endDate } });
  return data;
};

export interface BookingAnalysis {
  totalRoomRevenue: number;
  totalBookings: number;
  totalRoomsSold: number;
}

export const getBookingAnalysis = async (startDate: string, endDate: string): Promise<BookingAnalysis> => {
  const { data } = await api.get('/analysis/bookings', { params: { startDate, endDate } });
  return data;
};

export interface ChannelAnalysis {
  channelBreakdown: Record<string, number>;
}

export const getChannelAnalysis = async (startDate: string, endDate: string): Promise<ChannelAnalysis> => {
  const { data } = await api.get('/analysis/channel', { params: { startDate, endDate } });
  return data;
};
