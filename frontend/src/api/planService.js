import client from './client';

export const planService = {
  getAll: () => client.get('/plans'),
  getOne: (id) => client.get(`/plans/${id}`),
  create: (data) => client.post('/plans', data),
  update: (id, data) => client.put(`/plans/${id}`, data),
  remove: (id) => client.delete(`/plans/${id}`),
};
