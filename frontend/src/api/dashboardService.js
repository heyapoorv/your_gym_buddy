import client from './client';

export const dashboardService = {
  getMetrics: () => client.get('/dashboard'),
  getGyms: (params) => client.get('/dashboard/gyms', { params }),
  getGymDetails: (id) => client.get(`/dashboard/gyms/${id}`),
  updateGymPlan: (id, planData) => client.put(`/dashboard/gyms/${id}/plan`, planData),
  editGym: (id, gymData) => client.put(`/dashboard/gyms/${id}`, gymData),
  deleteGym: (id) => client.delete(`/dashboard/gyms/${id}`),
};

