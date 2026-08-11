import api from './api';

export interface BookingRoomPayload {
  roomCode: string;
  rateplanCode: string;
  roomNumber: string | null;
  adults: number;
  children: number;
}

export interface BookingPayload {
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  specialRequests?: string;
  totalAdults: number;
  totalChildren: number;
  rooms: BookingRoomPayload[];
}

export const createBooking = async (payload: BookingPayload) => {
  const { data } = await api.post('/bookings', payload);
  return data;
};

export const getBookings = async (phone?: string) => {
  const { data } = await api.get('/bookings', {
    params: phone ? { phone } : undefined
  });
  return data;
};

export const getBookingById = async (id: number) => {
  const { data } = await api.get(`/bookings/${id}`);
  return data;
};

export const checkInBooking = async (id: number, rooms: { roomCode: string, roomNumber: string }[]) => {
  const { data } = await api.patch(`/bookings/${id}/check-in`, { rooms });
  return data;
};

export const checkOutBooking = async (id: number, roomDiscountAmount: number = 0, foodDiscountAmount: number = 0) => {
  const { data } = await api.patch(`/bookings/${id}/check-out`, { roomDiscountAmount, foodDiscountAmount });
  return data;
};

export const cancelBooking = async (id: number) => {
  const { data } = await api.patch(`/bookings/${id}/cancel`);
  return data;
};

export const editBookingRooms = async (id: number, rooms: { roomCode: string, roomNumber: string }[]) => {
  const { data } = await api.patch(`/bookings/${id}/edit-rooms`, { rooms });
  return data;
};
