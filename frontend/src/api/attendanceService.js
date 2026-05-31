import api from './client';

export const attendanceService = {
  getTodayStats: () => api.get('/api/attendance/today'),
  getHistory: (params = {}) => api.get('/api/attendance', { params }),
  checkIn: (data) => api.post('/api/attendance/checkin', data),
  checkOut: (id) => api.put(`/api/attendance/checkout/${id}`),
};
