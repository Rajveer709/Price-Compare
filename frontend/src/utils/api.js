import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens, logging, etc.
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors, logging, etc.
api.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
    
    return response;
  },
  (error) => {
    // Handle common error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear auth token and redirect to login
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          break;
        case 403:
          console.error('❌ Forbidden: You do not have permission to access this resource');
          break;
        case 404:
          console.error('❌ Not Found: The requested resource was not found');
          break;
        case 429:
          console.error('❌ Rate Limited: Too many requests, please try again later');
          break;
        case 500:
          console.error('❌ Server Error: Internal server error occurred');
          break;
        default:
          console.error(`❌ API Error (${status}):`, data?.message || error.message);
      }
    } else if (error.request) {
      // Network error
      console.error('❌ Network Error: Unable to connect to the server');
    } else {
      // Other error
      console.error('❌ Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API service functions
export const apiService = {
  // Generic CRUD operations
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),

  // Product-specific endpoints
  products: {
    getAll: (params = {}) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
  },

  // Search endpoints
  search: {
    products: (query, params = {}) => 
      api.get('/search', { params: { q: query, ...params } }),
    ebay: (query, params = {}) => 
      api.get('/ebay/search', { params: { q: query, ...params } }),
  },

  // eBay-specific endpoints
  ebay: {
    search: (params = {}) => api.get('/ebay/search', { params }),
    getProduct: (itemId) => api.get(`/ebay/products/${itemId}`),
    addToWatchlist: (itemId, targetPrice = null) => 
      api.post(`/ebay/watch/${itemId}`, { target_price: targetPrice }),
  },

  // User endpoints
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/profile'),
  },
};

// Utility functions
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

export const isNetworkError = (error) => {
  return !error.response && error.request;
};

export const isServerError = (error) => {
  return error.response && error.response.status >= 500;
};

export const isClientError = (error) => {
  return error.response && error.response.status >= 400 && error.response.status < 500;
};

export default api;