import client from './client';

export const attendanceService = {
  getTodayStats: () => client.get('/attendance/today'),
  getHistory: (params = {}) => client.get('/attendance', { params }),
  checkIn: (data) => client.post('/attendance/checkin', data),
  checkOut: (id) => client.put(`/attendance/checkout/${id}`),
};
