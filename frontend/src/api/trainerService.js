import api from './client';

export const trainerService = {
  getAll: () => api.get('/api/trainers'),
  create: (data) => api.post('/api/trainers', data),
  update: (id, data) => api.put(`/api/trainers/${id}`, data),
  assignMember: (id, memberId) => api.post(`/api/trainers/${id}/assign`, { memberId }),
  remove: (id) => api.delete(`/api/trainers/${id}`),
};
