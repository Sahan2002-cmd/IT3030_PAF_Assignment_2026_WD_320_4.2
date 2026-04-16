// src/components/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import Button from '../shared/Button';
import Input from '../shared/Input';
import './LoginPage.css';

const DEMO_ACCOUNTS = [
  { label: 'Admin',   email: 'admin@smartcampus.edu',   password: 'admin123',   badge: 'ADMIN',   color: '#3b82f6' },
  { label: 'Staff',   email: 'staff@smartcampus.edu',   password: 'staff123',   badge: 'STAFF',   color: '#10b981' },
  { label: 'Student', email: 'student@smartcampus.edu', password: 'student123', badge: 'STUDENT', color: '#f59e0b' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setApiError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account) => {
    setForm({ email: account.email, password: account.password });
    setErrors({});
    setApiError('');
  };

  return (
    <div className="login-page">
      {/* Left panel – branding */}
      <div className="login-brand">
        <div className="login-brand__bg-grid" />
        <div className="login-brand__inner">
          <div className="login-brand__logo-wrap">
            <div className="login-brand__logo-hex">
              <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="30,3 55,17 55,43 30,57 5,43 5,17" fill="rgba(59,130,246,0.12)" stroke="rgba(59,130,246,0.6)" strokeWidth="1.5"/>
                <polygon points="30,12 47,21.5 47,38.5 30,48 13,38.5 13,21.5" fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.4)" strokeWidth="1"/>
                <text x="30" y="35" textAnchor="middle" fill="#3b82f6" fontSize="16" fontWeight="800" fontFamily="monospace">SC</text>
              </svg>
            </div>
          </div>
          <h1 className="login-brand__title">SmartCampus</h1>
          <p className="login-brand__sub">Operations Hub</p>

          <div className="login-brand__divider" />

          <ul className="login-brand__features">
            {[
              { icon: '🏛️', text: 'Facilities & Assets Catalogue' },
              { icon: '📅', text: 'Booking Management' },
              { icon: '🔧', text: 'Maintenance Ticketing' },
              { icon: '🔔', text: 'Real-time Notifications' },
            ].map((f, i) => (
              <li key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="login-brand__feat-icon">{f.icon}</span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          {/* Demo credentials panel */}
          <div className="login-brand__demo">
            <p className="login-brand__demo-title">
              <span className="login-brand__demo-dot" />
              Demo Accounts
            </p>
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                className="login-brand__demo-card"
                onClick={() => fillDemo(a)}
                type="button"
              >
                <span className="login-brand__demo-badge" style={{ borderColor: a.color, color: a.color }}>
                  {a.badge}
                </span>
                <span className="login-brand__demo-email">{a.email}</span>
                <span className="login-brand__demo-fill">Fill →</span>
              </button>
            ))}
          </div>
        </div>
        <div className="login-brand__glow" />
      </div>

      {/* Right panel – form */}
      <div className="login-form-panel">
        <div className="login-card animate-fade">
          <div className="login-card__header">
            <h2 className="login-card__title">Welcome back</h2>
            <p className="login-card__sub">Sign in to your account to continue</p>
          </div>

          {/* OAuth buttons */}
          <div className="login-oauth">
            <button
              className="login-oauth-btn"
              onClick={() => {
                window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/oauth2/authorization/google`;
              }}
              type="button"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="login-divider">
            <span>or sign in with email</span>
          </div>

          {/* Email / Password form */}
          <form onSubmit={handleSubmit} noValidate>
            {apiError && (
              <div className="login-alert">
                <span className="login-alert__icon">⚠</span>
                {apiError}
              </div>
            )}

            <div className="login-fields">
              <Input
                label="Email address"
                type="email"
                placeholder="you@smartcampus.edu"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={errors.email}
                icon={<MailIcon />}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                error={errors.password}
                icon={<LockIcon />}
              />
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg">
              Sign In to Dashboard
            </Button>
          </form>

          <p className="login-register">
            Don't have an account?{' '}
            <Link to="/register">Create one</Link>
          </p>

          {/* Mobile demo hint */}
          <div className="login-demo-mobile">
            <p className="login-demo-mobile__title">Quick Demo Login</p>
            <div className="login-demo-mobile__cards">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  className="login-demo-mobile__btn"
                  style={{ borderColor: a.color + '40', color: a.color }}
                  onClick={() => fillDemo(a)}
                  type="button"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
