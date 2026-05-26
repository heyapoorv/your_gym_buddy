import client from './client';

export const memberService = {
  getAll: (params = {}) => client.get('/members', { params }),
  getOne: (id) => client.get(`/members/${id}`),
  create: (data) => client.post('/members', data),
  update: (id, data) => client.put(`/members/${id}`, data),
  remove: (id) => client.delete(`/members/${id}`),
  getStats: () => client.get('/members/stats'),
};
