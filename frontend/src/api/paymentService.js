import client from './client';

export const paymentService = {
  getStats: () => client.get('/payments/stats'),
  getAll: (params = {}) => client.get('/payments', { params }),
  create: (data) => client.post('/payments', data),
  update: (id, data) => client.put(`/payments/${id}`, data),
};
