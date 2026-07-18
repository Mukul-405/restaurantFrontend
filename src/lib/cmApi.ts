import api from './api';

export const fetchCMInventory = async (startDate: string, endDate: string) => {
  const { data } = await api.get(`/cm/inventory?startDate=${startDate}&endDate=${endDate}`);
  return data.data; // Since our controller wraps it in { success: true, data }
};

export const fetchCMRates = async (startDate: string, endDate: string) => {
  const { data } = await api.get(`/cm/rates?startDate=${startDate}&endDate=${endDate}`);
  return data.data;
};

export const fetchCMReservations = async (startDate: string, endDate: string) => {
  const { data } = await api.get(`/cm/reservations?startDate=${startDate}&endDate=${endDate}`);
  return data.data;
};

export const pushCMInventory = async (updates: any[], toChannels?: string[]) => {
  const { data } = await api.post('/cm/inventory/push', { updates, toChannels });
  return data.data;
};

export const pushCMRates = async (updates: any[], toChannels?: string[]) => {
  const { data } = await api.post('/cm/rates/push', { updates, toChannels });
  return data.data;
};
