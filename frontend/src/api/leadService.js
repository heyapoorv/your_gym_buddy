import client from './client';

export const leadService = {
  getAll: (params) => client.get('/leads', { params }),
  getStats: () => client.get('/leads/stats'),
  create: (data) => client.post('/leads', data),
  update: (id, data) => client.put(`/leads/${id}`, data),
};
