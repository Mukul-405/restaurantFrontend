import api from './api';

export interface BookingRoomPayload {
  roomCode: string;
  rateplanCode: string;
  roomNumber: string;
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

export const getBookings = async () => {
  const { data } = await api.get('/bookings');
  return data;
};

export const getBookingById = async (id: number) => {
  const { data } = await api.get(`/bookings/${id}`);
  return data;
};
