// src/components/pages/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import ResourceService from '../../services/ResourceService';
import Badge from '../shared/Badge';
import './DashboardPage.css';

function StatCard({ label, value, icon, color, to }) {
  return (
    <Link to={to} className="stat-card" style={{ '--card-color': color }}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__body">
        <span className="stat-card__value">{value ?? '—'}</span>
        <span className="stat-card__label">{label}</span>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    ResourceService.getAll()
      .then((r) => setResources(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active      = resources.filter((r) => r.status === 'ACTIVE').length;
  const outOfSvc    = resources.filter((r) => r.status === 'OUT_OF_SERVICE').length;
  const labs        = resources.filter((r) => r.type === 'LAB').length;
  const halls       = resources.filter((r) => r.type === 'LECTURE_HALL').length;

  const recentResources = resources.slice(0, 5);

  return (
    <div className="dashboard animate-fade">
      {/* Header */}
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__title">
            Good {getGreeting()},{' '}
            <span className="dashboard__name">{user?.name?.split(' ')[0] || 'there'}</span> 👋
          </h1>
          <p className="dashboard__sub">Here's what's happening on campus today.</p>
        </div>
        <div className="dashboard__date">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stat cards */}
      <div className="dashboard__stats">
        <StatCard to="/resources" label="Total Resources" value={loading ? '…' : resources.length} icon="🏛" color="#3b82f6" />
        <StatCard to="/resources" label="Active"          value={loading ? '…' : active}           icon="✅" color="#10b981" />
        <StatCard to="/resources" label="Out of Service"  value={loading ? '…' : outOfSvc}         icon="🔴" color="#ef4444" />
        <StatCard to="/resources" label="Labs"            value={loading ? '…' : labs}             icon="🔬" color="#f59e0b" />
        <StatCard to="/resources" label="Lecture Halls"   value={loading ? '…' : halls}            icon="🎓" color="#06b6d4" />
      </div>

      {/* Module quick links */}
      <div className="dashboard__modules">
        <h2 className="section-title">Modules</h2>
        <div className="dashboard__module-grid">
          {MODULES.map((m) => (
            <Link key={m.to} to={m.to} className="module-card">
              <div className="module-card__badge">MOD {m.mod}</div>
              <div className="module-card__icon">{m.icon}</div>
              <h3 className="module-card__name">{m.name}</h3>
              <p className="module-card__desc">{m.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent resources table */}
      <div className="dashboard__recent">
        <div className="section-header">
          <h2 className="section-title">Recent Resources</h2>
          <Link to="/resources" className="section-link">View all →</Link>
        </div>
        {loading ? (
          <div className="dashboard__loading">Loading resources…</div>
        ) : recentResources.length === 0 ? (
          <div className="dashboard__empty">No resources yet. <Link to="/resources">Add one</Link></div>
        ) : (
          <div className="dashboard__table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th><th>Type</th><th>Location</th><th>Capacity</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentResources.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.name}</td>
                    <td><span className="type-tag">{r.type}</span></td>
                    <td>{r.location}</td>
                    <td>{r.capacity}</td>
                    <td>
                      <Badge variant={r.status === 'ACTIVE' ? 'active' : 'inactive'}>
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

const MODULES = [
  { mod: 'A', to: '/resources',     icon: '🏛', name: 'Resources',          desc: 'Manage facilities & assets catalogue' },
  { mod: 'B', to: '/bookings',      icon: '📅', name: 'Bookings',           desc: 'Handle resource booking workflows' },
  { mod: 'C', to: '/tickets',       icon: '🔧', name: 'Maintenance',        desc: 'Incident tickets & technician updates' },
  { mod: 'D', to: '/notifications', icon: '🔔', name: 'Notifications',      desc: 'Booking & ticket status alerts' },
];
