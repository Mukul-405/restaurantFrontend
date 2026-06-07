import api from './api';

export const fetcher = {
  // Auth endpoints
  login: async (credentials: any) => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },
  logout: async (token: string) => {
    const { data } = await api.post('/auth/logout', { token });
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
  }
};
