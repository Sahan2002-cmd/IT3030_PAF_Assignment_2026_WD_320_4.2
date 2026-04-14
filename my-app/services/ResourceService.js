// src/services/ResourceService.js
import api from './ApiService';

const BASE = '/api/resources';

const ResourceService = {
  /** GET /api/resources?type=&location=&status= */
  getAll: (filters = {}) => {
    const params = {};
    if (filters.type)     params.type     = filters.type;
    if (filters.location) params.location = filters.location;
    if (filters.status)   params.status   = filters.status;
    return api.get(BASE, { params });
  },

  /** GET /api/resources/:id */
  getById: (id) => api.get(`${BASE}/${id}`),

  /** POST /api/resources */
  create: (data) => api.post(BASE, data),

  /** PUT /api/resources/:id */
  update: (id, data) => api.put(`${BASE}/${id}`, data),

  /** PATCH /api/resources/:id/status */
  updateStatus: (id, status) =>
    api.patch(`${BASE}/${id}/status`, { status }),

  /** DELETE /api/resources/:id */
  remove: (id) => api.delete(`${BASE}/${id}`),
};

export default ResourceService;
