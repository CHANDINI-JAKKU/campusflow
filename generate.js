const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'client');

const directories = [
  'src/components/ui',
  'src/components/layout',
  'src/components/charts',
  'src/components/notifications',
  'src/components/ai',
  'src/components/shared',
  'src/pages/auth',
  'src/pages/super-admin',
  'src/pages/admin',
  'src/pages/faculty',
  'src/pages/student',
  'src/pages/placement',
  'src/pages/shared',
  'src/layouts',
  'src/routes',
  'src/hooks',
  'src/services',
  'src/store',
  'src/utils',
  'src/config'
];

directories.forEach(dir => {
  fs.mkdirSync(path.join(baseDir, dir), { recursive: true });
});

// App.jsx
fs.writeFileSync(path.join(baseDir, 'src/App.jsx'), `import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';

function App() {
  const { initialize } = useAuthStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
`);

// src/store/authStore.js
fs.writeFileSync(path.join(baseDir, 'src/store/authStore.js'), `import { create } from 'zustand';
import { login, logout, refresh } from '../services/authService';

const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  
  login: async (email, password) => {
    const { data } = await login({ email, password });
    set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true });
    return data;
  },
  
  logout: async () => {
    await logout();
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
  
  refreshToken: async () => {
    try {
      const { data } = await refresh();
      set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true });
    } catch (error) {
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },
  
  initialize: async () => {
    set({ isLoading: true });
    try {
      const { data } = await refresh();
      set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  }
}));

export default useAuthStore;
`);

fs.writeFileSync(path.join(baseDir, 'src/store/themeStore.js'), `import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set) => ({
      isDark: false,
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
    }),
    {
      name: 'theme-storage',
    }
  )
);

export default useThemeStore;
`);

// api.js config
fs.writeFileSync(path.join(baseDir, 'src/config/api.js'), `export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
`);

// src/services/api.js
fs.writeFileSync(path.join(baseDir, 'src/services/api.js'), `import axios from 'axios';
import { API_URL } from '../config/api';
import useAuthStore from '../store/authStore';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await useAuthStore.getState().refreshToken();
        originalRequest.headers.Authorization = \`Bearer \${useAuthStore.getState().accessToken}\`;
        return api(originalRequest);
      } catch (e) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
`);

// routes/index.jsx
fs.writeFileSync(path.join(baseDir, 'src/routes/index.jsx'), `import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';
import LoginPage from '../pages/auth/LoginPage';
import StudentDashboard from '../pages/student/StudentDashboard';
import NotFoundPage from '../pages/shared/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Navigate to="/student/dashboard" />} />
        <Route path="/student/dashboard" element={<RoleRoute allowedRoles={['STUDENT']}><StudentDashboard /></RoleRoute>} />
        {/* Fill other routes here */}
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
`);

// More placeholder files would be generated here...
console.log('Scaffolding complete');
