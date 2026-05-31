import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log("API URL:", import.meta.env.VITE_API_URL);

// ─── Request interceptor — attach auth token ─────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — handle auth / subscription errors globally ────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code   = error.response?.data?.code;

    // 401 — Unauthorized (token expired/invalid) → force logout
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('gymos_user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // 402 — Subscription expired / trial ended
    // Emit a DOM event so any mounted component can react.
    // The SubscriptionExpiredModal already watches gymSubscriptionStatus
    // in AuthContext, so in most cases the UI is already showing the overlay.
    // This event allows ad-hoc components to also react if needed.
    if (status === 402 && code === 'SUBSCRIPTION_EXPIRED') {
      window.dispatchEvent(new CustomEvent('gymos:subscription_expired', {
        detail: error.response.data,
      }));
      return Promise.reject(error);
    }

    // 403 — Limit reached (members / staff cap hit)
    // Emit an event so the LimitReachedNotifier can surface a toast/banner.
    if (status === 403 && code === 'LIMIT_REACHED') {
      window.dispatchEvent(new CustomEvent('gymos:limit_reached', {
        detail: error.response.data,
      }));
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
