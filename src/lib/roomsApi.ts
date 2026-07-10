import api from './api';

export interface RoomType {
  id: number;
  name: string;
  roomCode: string;
  description?: string;
  maxAdults: number;
  maxChildren: number;
  totalRooms: number;
  availableRooms: number;
  basePrice?: string;
  extraPersonAmount?: string;
  rateplanCodes?: { code: string; price: number }[];
  rooms?: { roomNumber: string; status?: string; userRoomBookingId?: string }[];
  isActive: boolean;
}



export const getRoomTypes = async (startDate?: string, endDate?: string): Promise<RoomType[]> => {
  const params = startDate && endDate ? { startDate, endDate } : {};
  const { data } = await api.get('/room-types', { params });
  return data;
};

export const createRoomType = async (payload: Partial<RoomType>): Promise<RoomType> => {
  const { data } = await api.post('/room-types', payload);
  return data.roomType;
};

export const updateRoomType = async (id: number, payload: Partial<RoomType>): Promise<RoomType> => {
  const { data } = await api.patch(`/room-types/${id}`, payload);
  return data.roomType;
};

export const deleteRoomType = async (id: number) => {
  const response = await api.delete(`/room-types/${id}`);
  return response.data;
};

export const addRoomToType = async (id: number, roomData: { roomNumber: string; status?: string }) => {
  const response = await api.post(`/room-types/${id}/rooms`, roomData);
  return response.data.roomType;
};

export const deleteRoomFromType = async (id: number, roomNumber: string) => {
  const response = await api.delete(`/room-types/${id}/rooms/${roomNumber}`);
  return response.data.roomType;
};
