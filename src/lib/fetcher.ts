import api from './api';

export const fetcher = {
  // Auth endpoints
  login: async (credentials: any) => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },
  logout: async () => {
    const { data } = await api.post('/auth/logout');
    return data;
  },
  getCurrentUser: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  // Users endpoints
  getUsers: async () => {
    const { data } = await api.get('/users');
    return data;
  },
  createUser: async (userData: any) => {
    const { data } = await api.post('/users', userData);
    return data;
  },
  deleteUser: async (userId: string) => {
    const { data } = await api.delete(`/users/${userId}`);
    return data;
  },
  blockUser: async (userId: string) => {
    const { data } = await api.patch(`/users/${userId}/block`);
    return data;
  },
  unblockUser: async (userId: string) => {
    const { data } = await api.patch(`/users/${userId}/unblock`);
    return data;
  },
  resetPassword: async (userId: string, password: string) => {
    const { data } = await api.patch(`/users/${userId}/reset-password`, { password });
    return data;
  },

  // Menu endpoints
  getMenu: async () => {
    const { data } = await api.get('/menu');
    return data;
  },
  createMenuItem: async (menuData: any) => {
    const { data } = await api.post('/menu', menuData);
    return data;
  },
  updateMenuItem: async (id: string | number, menuData: any) => {
    const { data } = await api.patch(`/menu/${id}`, menuData);
    return data;
  },
  deleteMenuItem: async (id: string | number) => {
    const { data } = await api.delete(`/menu/${id}`);
    return data;
  },
  bulkCreateCategories: async (categories: string[]) => {
    const { data } = await api.post('/menu/categories/bulk', { categories });
    return data;
  },

  // Order endpoints
  getOrders: async (params?: Record<string, any>) => {
    const { data } = await api.get('/orders', { params });
    return data;
  },
  getKots: async (params?: Record<string, any>) => {
    const { data } = await api.get('/orders/kots', { params });
    return data;
  },
  getOrderById: async (id: number | string) => {
    const { data } = await api.get(`/orders/${id}`);
    return data;
  },
  createOrder: async (orderData: any) => {
    const { data } = await api.post('/orders', orderData);
    return data;
  },
  updateOrder: async (id: number | string, orderData: any) => {
    const { data } = await api.put(`/orders/${id}`, orderData);
    return data;
  },
  transferOrderToRoom: async (id: number | string, guestPhone: string) => {
    const { data } = await api.post(`/orders/${id}/transfer-to-room`, { guestPhone });
    return data;
  }
};
