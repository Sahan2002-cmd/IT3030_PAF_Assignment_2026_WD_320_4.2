// src/store/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import UserService from '../services/UserService';

const AuthContext = createContext(null);

// ─── Hardcoded Demo Credentials ──────────────────────────────────────────────
const DEMO_USERS = [
  {
    email: 'admin@smartcampus.edu',
    password: 'admin123',
    user: { id: 1, name: 'Admin User', email: 'admin@smartcampus.edu', role: 'ADMIN', avatar: null },
  },
  {
    email: 'staff@smartcampus.edu',
    password: 'staff123',
    user: { id: 2, name: 'Staff Member', email: 'staff@smartcampus.edu', role: 'STAFF', avatar: null },
  },
  {
    email: 'student@smartcampus.edu',
    password: 'student123',
    user: { id: 3, name: 'Student User', email: 'student@smartcampus.edu', role: 'STUDENT', avatar: null },
  },
];

// Set to true to bypass API and use demo credentials above
const USE_HARDCODED_LOGIN = true;
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (USE_HARDCODED_LOGIN) {
      const savedUser = localStorage.getItem('sc_user');
      if (savedUser) {
        try { setUser(JSON.parse(savedUser)); } catch { localStorage.removeItem('sc_user'); }
      }
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await UserService.getMe();
        setUser(res.data?.data || res.data);
      } catch { setUser(null); }
      finally { setLoading(false); }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    if (USE_HARDCODED_LOGIN) {
      const match = DEMO_USERS.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (!match) {
        const err = new Error('Invalid email or password');
        err.response = { data: { message: 'Invalid email or password' } };
        throw err;
      }
      const token = `demo-token-${match.user.id}-${Date.now()}`;
      localStorage.setItem('sc_token', token);
      localStorage.setItem('sc_user', JSON.stringify(match.user));
      setUser(match.user);
      return { user: match.user, token };
    }
    const res = await UserService.login(email, password);
    const payload = res.data?.data || res.data;
    if (payload?.token) localStorage.setItem('sc_token', payload.token);
    setUser(payload?.user || payload);
    return payload;
  }, []);

  const logout = useCallback(async () => {
    if (!USE_HARDCODED_LOGIN) {
      try { await UserService.logout(); } catch { /* ignore */ }
    }
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_user');
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
