// src/services/UserService.js
import api, { toApiUrl } from './ApiService';

const UserService = {
  /** Standard email/password login → POST /api/auth/login */
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }),

  /** Register new user → POST /api/auth/register */
  register: (userData) =>
    api.post('/api/auth/register', userData),

  /** Get current authenticated user → GET /api/auth/me */
  getMe: () => api.get('/api/auth/me'),

  /** Logout → POST /api/auth/logout */
  logout: () => api.post('/api/auth/logout'),

  /** Redirect to Google OAuth2 (Spring Security handles the flow) */
  loginWithGoogle: () => {
    window.location.href = toApiUrl('/oauth2/authorization/google');
  },

  /** Redirect to Facebook OAuth2 */
  loginWithFacebook: () => {
    window.location.href = toApiUrl('/oauth2/authorization/facebook');
  },

  /** Admin: get all users → GET /api/users */
  getAllUsers: () => api.get('/api/users'),

  /** Admin: get user by id → GET /api/users/:id */
  getUserById: (id) => api.get(`/api/users/${id}`),

  /** Admin: update user → PUT /api/users/:id */
  updateUser: (id, data) => api.put(`/api/users/${id}`, data),

  /** Admin: delete user → DELETE /api/users/:id */
  deleteUser: (id) => api.delete(`/api/users/${id}`),
};

export default UserService;
