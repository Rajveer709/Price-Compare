import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const productApi = {
  searchProducts: async (query) => {
    const response = await api.get(`/api/v1/products/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
  getProduct: async (id) => {
    const response = await api.get(`/api/v1/products/${id}`);
    return response.data;
  },
  // Add more API methods as needed
};

export default api;
