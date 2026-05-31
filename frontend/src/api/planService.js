import api from './client';

export const planService = {
  getAll: () => api.get('/api/plans'),
  getOne: (id) => api.get(`/api/plans/${id}`),
  create: (data) => api.post('/api/plans', data),
  update: (id, data) => api.put(`/api/plans/${id}`, data),
  remove: (id) => api.delete(`/api/plans/${id}`),
};
