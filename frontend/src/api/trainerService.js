import client from './client';

export const trainerService = {
  getAll: () => client.get('/trainers'),
  create: (data) => client.post('/trainers', data),
  update: (id, data) => client.put(`/trainers/${id}`, data),
  assignMember: (id, memberId) => client.post(`/trainers/${id}/assign`, { memberId }),
  remove: (id) => client.delete(`/trainers/${id}`),
};
