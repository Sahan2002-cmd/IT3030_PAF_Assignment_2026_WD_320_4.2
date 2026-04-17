import axios from 'axios';

const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

export const toApiUrl = (path = '') => {
  const normalizedPath = path
    ? (path.startsWith('/') ? path : `/${path}`)
    : '';

  return configuredApiUrl ? `${configuredApiUrl}${normalizedPath}` : normalizedPath || '/';
};

const api = axios.create({
  baseURL: configuredApiUrl || '',
  headers: { 'Content-Type': 'application/json' },
  // withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
