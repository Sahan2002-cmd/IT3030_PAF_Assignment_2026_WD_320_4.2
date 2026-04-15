// src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard',   icon: '⊞', label: 'Dashboard' },
  { to: '/resources',   icon: '🏛', label: 'Resources',    module: 'A' },
  { to: '/bookings',    icon: '📅', label: 'Bookings',     module: 'B' },
  { to: '/tickets',     icon: '🔧', label: 'Maintenance',  module: 'C' },
  { to: '/notifications', icon: '🔔', label: 'Notifications', module: 'D' },
];

const ADMIN_ITEMS = [
  { to: '/users', icon: '👥', label: 'Users' },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">⬡</div>
        {!collapsed && (
          <div className="sidebar__logo-text">
            <span className="sidebar__logo-title">SmartCampus</span>
            <span className="sidebar__logo-sub">Operations Hub</span>
          </div>
        )}
        <button className="sidebar__toggle" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* User pill */}
      {!collapsed && user && (
        <div className="sidebar__user animate-fade">
          <div className="sidebar__avatar">{(user.name || user.email || 'U')[0].toUpperCase()}</div>
          <div className="sidebar__user-info">
            <span className="sidebar__user-name">{user.name || 'User'}</span>
            <span className="sidebar__user-role">{user.role || 'USER'}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar__nav">
        <span className="sidebar__section-label">{!collapsed && 'MENU'}</span>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
            }
          >
            <span className="sidebar__link-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar__link-label">{item.label}</span>}
            {!collapsed && item.module && (
              <span className="sidebar__module-tag">Mod {item.module}</span>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <span className="sidebar__section-label">{!collapsed && 'ADMIN'}</span>
            {ADMIN_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
                }
              >
                <span className="sidebar__link-icon">{item.icon}</span>
                {!collapsed && <span className="sidebar__link-label">{item.label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Logout */}
      <button className="sidebar__logout" onClick={handleLogout}>
        <span className="sidebar__link-icon">⏻</span>
        {!collapsed && <span>Logout</span>}
      </button>
    </aside>
  );
}
