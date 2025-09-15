import axios from 'axios';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000' || '/api', // Changed from process.env to import.meta.env
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      error.message = error.response.data?.message || 
                   error.response.statusText || 
                   'Request failed';
    } else if (error.request) {
      error.message = 'Network error - no response from server';
    }
    return Promise.reject(error);
  }
);

// Helper methods
api.setToken = (token, persist = true) => {
  if (persist) {
    localStorage.setItem('token', token);
  } else {
    sessionStorage.setItem('token', token);
  }
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

api.clearToken = () => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  delete api.defaults.headers.common['Authorization'];
};

export default api;