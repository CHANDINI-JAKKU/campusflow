import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.accessToken);
    set({ user: data.user, isAuthenticated: true });
    return data.user;
  },

  registerUser: async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('token', data.accessToken);
    set({ user: data.user, isAuthenticated: true });
    return data.user;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false });
      window.location.href = '/login';
    }
  },
}));

export default useAuthStore;
