import axios from 'axios';
import { getApiBaseUrl } from '../config/apiConfig';

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 30s timeout for slow connections
});

// ─── REQUEST INTERCEPTOR ───────────────────────────────────────────────────────
// Attach Authorization Bearer Token from localStorage automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR ─────────────────────────────────────────────────────
// Centralized error handling: auto-logout on 401, surface readable messages
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      // Token expired / unauthorized → clear session and redirect to login
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Avoid redirect loop if already on /login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }

      // Rate-limited → surface a friendly message
      if (status === 429) {
        error.message = 'Too many requests. Please slow down and try again.';
      }

      // Server-side error → prefer backend message
      if (status >= 500) {
        error.message = error.response?.data?.message || 'Server error. Please try again later.';
      }
    } else if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please check your connection.';
    } else if (!error.response) {
      error.message = 'Network error. Cannot reach server.';
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;