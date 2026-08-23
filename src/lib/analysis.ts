import api from './api';

export interface PaymentModeBreakdown {
  count: number;
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
}

export interface RevenueAnalysis {
  totalBaseAmount: number;
  totalGstAmount: number;
  totalDiscountAmount: number;
  totalFinalDiscountedAmount: number;
  totalOrders: number;
  paymentModes?: {
    CASH: PaymentModeBreakdown;
    CARD: PaymentModeBreakdown;
    UPI: PaymentModeBreakdown;
    ROOM_TRANSFER: PaymentModeBreakdown;
  };
  cashAmount?: number;
  cardAmount?: number;
  upiAmount?: number;
  roomTransferAmount?: number;
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

export interface OrderItemStat {
  menuItemId?: number;
  name: string;
  totalQuantity: number;
  price: number;
  totalAmount: number;
  orderCount: number;
}

export interface OrderItemAnalysis {
  totalItemsSold: number;
  totalUniqueItems: number;
  totalAmountExcludingGst: number;
  items: OrderItemStat[];
}

export const getOrderItemAnalysis = async (startDate: string, endDate: string): Promise<OrderItemAnalysis> => {
  const { data } = await api.get('/analysis/order-items', { params: { startDate, endDate } });
  return data;
};
