import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

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