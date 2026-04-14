// src/services/ApiService.js
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,   // needed for Spring Security session cookie / OAuth2
});

// ── Attach JWT if stored ─────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Global error normaliser ──────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sc_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
