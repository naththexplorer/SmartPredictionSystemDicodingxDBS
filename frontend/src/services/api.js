import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 → redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/src/pages/login.html';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// ─── Predictions ─────────────────────────────────────
export const predictionAPI = {
  predict: (data) => api.post('/predictions', data),
  getHistory: () => api.get('/predictions'),
};

// ─── Reports ─────────────────────────────────────────
export const reportAPI = {
  getAll: () => api.get('/reports'),
  getById: (id) => api.get(`/reports/${id}`),
  create: (data) => api.post('/reports', data),
  update: (id, data) => api.put(`/reports/${id}`, data),
  delete: (id) => api.delete(`/reports/${id}`),
};

// ─── Disasters ───────────────────────────────────────
export const disasterAPI = {
  getAll: () => api.get('/disasters'),
  getById: (id) => api.get(`/disasters/${id}`),
};

export default api;