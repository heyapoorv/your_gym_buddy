import api from './client';

export const dashboardService = {
  getMetrics: () => api.get('/api/dashboard'),
  getGyms: (params) => api.get('/api/dashboard/gyms', { params }),
  getGymDetails: (id) => api.get(`/api/dashboard/gyms/${id}`),
  updateGymPlan: (id, planData) => api.put(`/api/dashboard/gyms/${id}/plan`, planData),
  editGym: (id, gymData) => api.put(`/api/dashboard/gyms/${id}`, gymData),
  deleteGym: (id) => api.delete(`/api/dashboard/gyms/${id}`),
};

