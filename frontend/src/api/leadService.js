import api from './client';

export const leadService = {
  getAll: (params) => api.get('/api/leads', { params }),
  getStats: () => api.get('/api/leads/stats'),
  create: (data) => api.post('/api/leads', data),
  update: (id, data) => api.put(`/api/leads/${id}`, data),
};
