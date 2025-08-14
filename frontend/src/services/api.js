import axios from 'axios';
import { getAuthToken } from '../utils/auth';

// Use environment variable for API base URL with fallback to development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      
      // Handle specific status codes
      if (error.response.status === 401) {
        // Handle unauthorized (e.g., redirect to login)
        console.error('Authentication required');
      } else if (error.response.status === 403) {
        console.error('Permission denied');
      } else if (error.response.status === 404) {
        console.error('Resource not found');
      } else if (error.response.status >= 500) {
        console.error('Server error');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Search Service - Handles product search and filtering
 */
export const searchService = {
  // Search products with query and filters
  searchProducts: async (query, filters = {}) => {
    try {
      const params = {
        q: query,
        ...filters,
      };
      
      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
      
      const response = await api.get('/search', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  // Get search suggestions
  getSuggestions: async (query) => {
    try {
      const response = await api.get('/search/suggestions', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw error;
    }
  },

  // Get search filters
  getSearchFilters: async () => {
    try {
      const response = await api.get('/search/filters');
      return response.data;
    } catch (error) {
      console.error('Error getting search filters:', error);
      throw error;
    }
  },
};

/**
 * Product Service - Handles product-related operations
 */
export const productService = {
  // Get all products with pagination and filters
  getProducts: async (params = {}) => {
    try {
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get a single product by ID
  getProductById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  },

  // Get price history for a product
  getPriceHistory: async (productId, params = {}) => {
    try {
      const response = await api.get(`/products/${productId}/history`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching price history for product ${productId}:`, error);
      throw error;
    }
  },

  // Get similar products
  getSimilarProducts: async (productId, params = {}) => {
    try {
      const response = await api.get(`/products/${productId}/similar`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching similar products for ${productId}:`, error);
      throw error;
    }
  },
};

/**
 * User Service - Handles user-related operations
 */
export const userService = {
  // Register a new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await api.patch('/users/me', userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },
};

/**
 * Watchlist Service - Handles user watchlist operations
 */
export const watchlistService = {
  // Get user's watchlist
  getWatchlist: async () => {
    try {
      const response = await api.get('/watchlist');
      return response.data;
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      throw error;
    }
  },

  // Add product to watchlist
  addToWatchlist: async (productId) => {
    try {
      const response = await api.post('/watchlist', { productId });
      return response.data;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  },

  // Remove product from watchlist
  removeFromWatchlist: async (productId) => {
    try {
      const response = await api.delete(`/watchlist/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  },

  // Check if product is in watchlist
  isInWatchlist: async (productId) => {
    try {
      const response = await api.get(`/watchlist/${productId}`);
      return response.data.isInWatchlist;
    } catch (error) {
      console.error('Error checking watchlist status:', error);
      throw error;
    }
  },
};

/**
 * Notification Service - Handles price alerts and notifications
 */
export const notificationService = {
  // Get user notifications
  getNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Create a price alert
  createPriceAlert: async (productId, targetPrice) => {
    try {
      const response = await api.post('/notifications/alerts', {
        productId,
        targetPrice,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating price alert:', error);
      throw error;
    }
  },

  // Delete a price alert
  deletePriceAlert: async (alertId) => {
    try {
      const response = await api.delete(`/notifications/alerts/${alertId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting price alert:', error);
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },
};

export default api;
