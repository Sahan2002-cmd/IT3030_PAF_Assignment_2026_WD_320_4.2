// src/components/pages/ResourcesPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import ResourceService from '../../services/ResourceService';
import { useAuth } from '../../store/AuthContext';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Badge from '../shared/Badge';
import Modal from '../shared/Modal';
import './ResourcesPage.css';

const TYPES     = ['', 'LAB', 'LECTURE_HALL', 'MEETING_ROOM', 'EQUIPMENT'];
const STATUSES  = ['', 'ACTIVE', 'OUT_OF_SERVICE'];

const EMPTY_FORM = { name: '', type: 'LAB', capacity: '', location: '', availabilityWindows: '', status: 'ACTIVE' };

export default function ResourcesPage() {
  const { isAdmin }          = useAuth();
  const [resources, setResources] = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  // Filters
  const [filters, setFilters] = useState({ type: '', location: '', status: '' });

  // Modal state
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm]   = useState(EMPTY_FORM);
  const [formErr, setFormErr] = useState({});
  const [saving, setSaving]   = useState(false);
  const [saveErr, setSaveErr] = useState('');

  // Delete confirm
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchResources = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await ResourceService.getAll(filters);
      const data = res.data?.data || [];
      setResources(data);
      setFiltered(data);
    } catch {
      setError('Failed to load resources.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  // ── Local filter (client-side type/location) ─────────────────────────────────
  useEffect(() => {
    let r = [...resources];
    if (filters.type)     r = r.filter((x) => x.type === filters.type);
    if (filters.location) r = r.filter((x) => x.location.toLowerCase().includes(filters.location.toLowerCase()));
    if (filters.status)   r = r.filter((x) => x.status === filters.status);
    setFiltered(r);
  }, [resources, filters]);

  // ── Form helpers ─────────────────────────────────────────────────────────────
  const openCreate = () => { setForm(EMPTY_FORM); setFormErr({}); setSaveErr(''); setModal({ open: true, mode: 'create', data: null }); };
  const openEdit   = (r) => {
    setForm({ name: r.name, type: r.type, capacity: r.capacity, location: r.location, availabilityWindows: r.availabilityWindows || '', status: r.status });
    setFormErr({}); setSaveErr('');
    setModal({ open: true, mode: 'edit', data: r });
  };
  const closeModal = () => setModal({ open: false, mode: 'create', data: null });

  const setF = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.name)     e.name     = 'Name is required';
    if (!form.type)     e.type     = 'Type is required';
    if (!form.capacity || Number(form.capacity) < 1) e.capacity = 'Capacity ≥ 1';
    if (!form.location) e.location = 'Location is required';
    return e;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErr(errs); return; }
    setFormErr({}); setSaveErr(''); setSaving(true);
    try {
      const payload = { ...form, capacity: Number(form.capacity) };
      if (modal.mode === 'create') {
        await ResourceService.create(payload);
      } else {
        await ResourceService.update(modal.data.id, payload);
      }
      closeModal();
      fetchResources();
    } catch (err) {
      setSaveErr(err.response?.data?.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Status toggle ────────────────────────────────────────────────────────────
  const toggleStatus = async (r) => {
    const next = r.status === 'ACTIVE' ? 'OUT_OF_SERVICE' : 'ACTIVE';
    try {
      await ResourceService.updateStatus(r.id, next);
      fetchResources();
    } catch { /* ignore */ }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await ResourceService.remove(deleteId);
      setDeleteId(null);
      fetchResources();
    } catch { /* ignore */ } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="resources-page animate-fade">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Resources <span className="page-title__mod">Module A</span></h1>
          <p className="page-sub">Facilities &amp; Assets Catalogue</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} icon={<span>＋</span>}>Add Resource</Button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select className="filter-select" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          {TYPES.map((t) => <option key={t} value={t}>{t || 'All Types'}</option>)}
        </select>
        <input
          className="filter-input"
          placeholder="Filter by location…"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
        />
        <select className="filter-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        <button className="filter-reset" onClick={() => setFilters({ type: '', location: '', status: '' })}>
          Reset
        </button>
        <span className="filter-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Error */}
      {error && <div className="page-alert">{error}</div>}

      {/* Table */}
      {loading ? (
        <div className="page-loading">Loading resources…</div>
      ) : filtered.length === 0 ? (
        <div className="page-empty">
          <span>🏛</span>
          <p>No resources found.</p>
          {isAdmin && <Button onClick={openCreate} size="sm">Add first resource</Button>}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Type</th><th>Capacity</th>
                <th>Location</th><th>Availability</th><th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="text-muted">#{r.id}</td>
                  <td className="font-medium">{r.name}</td>
                  <td><span className="type-tag">{r.type}</span></td>
                  <td>{r.capacity}</td>
                  <td>{r.location}</td>
                  <td className="text-muted">{r.availabilityWindows || '—'}</td>
                  <td>
                    <Badge variant={r.status === 'ACTIVE' ? 'active' : 'inactive'}>
                      {r.status}
                    </Badge>
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="action-btns">
                        <button className="action-btn action-btn--edit" onClick={() => openEdit(r)} title="Edit">✏</button>
                        <button
                          className={`action-btn ${r.status === 'ACTIVE' ? 'action-btn--warn' : 'action-btn--success'}`}
                          onClick={() => toggleStatus(r)}
                          title={r.status === 'ACTIVE' ? 'Set Out of Service' : 'Set Active'}
                        >
                          {r.status === 'ACTIVE' ? '⏸' : '▶'}
                        </button>
                        <button className="action-btn action-btn--delete" onClick={() => setDeleteId(r.id)} title="Delete">🗑</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modal.open}
        onClose={closeModal}
        title={modal.mode === 'create' ? 'Add New Resource' : 'Edit Resource'}
        size="md"
      >
        {saveErr && <div className="modal-alert">{saveErr}</div>}
        <div className="form-grid">
          <Input label="Name *"      value={form.name}     onChange={setF('name')}     error={formErr.name}     placeholder="e.g. Lab A101" />
          <div className="input-group">
            <label className="input-label">Type *</label>
            <select className="input-field" value={form.type} onChange={setF('type')}>
              {TYPES.filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {formErr.type && <span className="input-error">{formErr.type}</span>}
          </div>
          <Input label="Capacity *"  value={form.capacity} onChange={setF('capacity')} error={formErr.capacity} placeholder="e.g. 30" type="number" min="1" />
          <Input label="Location *"  value={form.location} onChange={setF('location')} error={formErr.location} placeholder="e.g. Block A" />
          <Input label="Availability Windows" value={form.availabilityWindows} onChange={setF('availabilityWindows')} placeholder="e.g. 08:00-18:00" />
          {modal.mode === 'edit' && (
            <div className="input-group">
              <label className="input-label">Status</label>
              <select className="input-field" value={form.status} onChange={setF('status')}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
              </select>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <Button variant="ghost" onClick={closeModal}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>
            {modal.mode === 'create' ? 'Create Resource' : 'Save Changes'}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Resource" size="sm">
        <p className="delete-confirm-text">Are you sure you want to permanently delete this resource? This cannot be undone.</p>
        <div className="modal-actions">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
