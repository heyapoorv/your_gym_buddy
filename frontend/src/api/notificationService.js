import client from './client';

export const notificationService = {
  getAll: () => client.get('/notifications'),
  markAsRead: (id) => client.put(`/notifications/${id}/read`),
  markAllAsRead: () => client.put('/notifications/mark-all-read'),
};
