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

export interface DailyBillSummaryItem {
  id: number;
  billNo: string;
  orderNumber: number;
  createdAt: string;
  dateStr: string;
  dateHeaderStr: string;
  dateKey: string;
  tableNumber: number | null;
  status: string;
  cancellationReason?: string | null;
  paymentMode: string | null;
  baseAmount: number;
  originalBaseAmount?: number;
  discountAmount: number;
  taxableAmount: number;
  sgstAmount: number;
  cgstAmount: number;
  totalAmount: number;
  finalDiscountedAmount: number;
  waiterName?: string;
  remarks: string;
}

export interface DayGroupSummary {
  dateStr: string;
  dateHeaderStr: string;
  dateKey: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalBaseAmount: number;
  totalDiscountAmount: number;
  totalTaxableAmount: number;
  totalSgstAmount: number;
  totalCgstAmount: number;
  totalAmount: number;
  orders: DailyBillSummaryItem[];
}

export interface DailyBillSummaryResult {
  startDate: string;
  endDate: string;
  monthTitle: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalBaseAmount: number;
  totalDiscountAmount: number;
  totalTaxableAmount: number;
  totalSgstAmount: number;
  totalCgstAmount: number;
  grandTotalAmount: number;
  days: DayGroupSummary[];
  allOrders?: DailyBillSummaryItem[];
}

export const getDailyBillSummary = async (startDate: string, endDate: string): Promise<DailyBillSummaryResult> => {
  const { data } = await api.get('/analysis/daily-bills', { params: { startDate, endDate } });
  return data;
};


export interface HotelPaymentModeBreakdown {
  count: number;
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
  commission: number;
  roomDiscountAmount: number;
  tds: number;
  tcs: number;
  finalAmount: number;
}

export interface HotelRevenueAnalysis {
  totalBookings: number;
  totalAmount: number;
  taxAmount: number;
  baseAmount: number;
  commission: number;
  roomDiscountAmount: number;
  tds: number;
  tcs: number;
  finalAmount: number;
  paymentModes: {
    CASH: HotelPaymentModeBreakdown;
    CARD: HotelPaymentModeBreakdown;
    UPI: HotelPaymentModeBreakdown;
  };
}

export const getHotelRevenueAnalysis = async (startDate: string, endDate: string): Promise<HotelRevenueAnalysis> => {
  const { data } = await api.get('/analysis/hotel-revenue', { params: { startDate, endDate } });
  return data;
};

export interface HotelDailyBillItem {
  id: number;
  bookingId: string;
  guestName: string;
  guestPhone: string;
  channel: string;
  source: string;
  checkIn: string;
  checkOut: string;
  dateStr: string;
  dateHeaderStr: string;
  dateKey: string;
  status: string;
  paymentMode: string | null;
  paymentStatus: string;
  totalAmount: number;
  taxAmount: number;
  baseAmount: number;
  roomDiscountAmount: number;
  commission: number;
  tcs: number;
  tds: number;
  finalAmount: number;
  roomsCount: number;
}

export interface HotelDayGroupSummary {
  dateStr: string;
  dateHeaderStr: string;
  dateKey: string;
  totalBookings: number;
  checkedOutBookings: number;
  cancelledBookings: number;
  totalBaseAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
  totalDiscountAmount: number;
  totalCommission: number;
  totalTcs: number;
  totalTds: number;
  totalFinalAmount: number;
  bookings: HotelDailyBillItem[];
}

export interface HotelDailyBillSummaryResult {
  startDate: string;
  endDate: string;
  monthTitle: string;
  totalBookings: number;
  checkedOutBookings: number;
  cancelledBookings: number;
  totalBaseAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
  totalDiscountAmount: number;
  totalCommission: number;
  totalTcs: number;
  totalTds: number;
  grandTotalFinalAmount: number;
  days: HotelDayGroupSummary[];
  channels: string[];
}

export const getHotelDailyBillSummary = async (startDate: string, endDate: string): Promise<HotelDailyBillSummaryResult> => {
  const { data } = await api.get("/analysis/hotel-daily-bills", { params: { startDate, endDate } });
  return data;
};
