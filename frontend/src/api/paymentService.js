import api from './client';

export const paymentService = {
  getStats: () => api.get('/api/payments/stats'),
  getAll: (params = {}) => api.get('/api/payments', { params }),
  create: (data) => api.post('/api/payments', data),
  update: (id, data) => api.put(`/api/payments/${id}`, data),
};
