import api from './client';

export const memberService = {
  getAll: (params = {}) => api.get('/api/members', { params }),
  getOne: (id) => api.get(`/api/members/${id}`),
  create: (data) => api.post('/api/members', data),
  update: (id, data) => api.put(`/api/members/${id}`, data),
  remove: (id) => api.delete(`/api/members/${id}`),
  getStats: () => api.get('/api/members/stats'),
};
