import { api } from './api';

/**
 * Search for products on eBay
 * @param {string} query - Search query string
 * @param {object} filters - Search filters (sort, price range, etc.)
 * @returns {Promise<Array>} - Array of product objects
 */
export const searchProducts = async (query, filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Add search query
    if (query) {
      params.append('q', query);
    }
    
    // Add filters
    if (filters.sort) {
      params.append('sort', filters.sort);
    }
    
    if (filters.minPrice) {
      params.append('min_price', filters.minPrice);
    }
    
    if (filters.maxPrice) {
      params.append('max_price', filters.maxPrice);
    }
    
    if (filters.condition && filters.condition.length > 0) {
      params.append('condition', filters.condition.join(','));
    }
    
    if (filters.freeShipping) {
      params.append('free_shipping', 'true');
    }
    
    const response = await api.get(`/api/products/search?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

/**
 * Get product details by ID
 * @param {string} productId - Product ID
 * @returns {Promise<object>} - Product details
 */
export const getProductDetails = async (productId) => {
  try {
    const response = await api.get(`/api/products/${productId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    throw error;
  }
};

/**
 * Get similar products
 * @param {string} productId - Product ID
 * @returns {Promise<Array>} - Array of similar products
 */
export const getSimilarProducts = async (productId) => {
  try {
    const response = await api.get(`/api/products/${productId}/similar`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching similar products for ${productId}:`, error);
    throw error;
  }
};

/**
 * Get trending products
 * @param {string} [category] - Optional category filter
 * @returns {Promise<Array>} - Array of trending products
 */
export const getTrendingProducts = async (category) => {
  try {
    const url = category 
      ? `/api/trending?category=${encodeURIComponent(category)}`
      : '/api/trending';
      
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching trending products:', error);
    throw error;
  }
};

/**
 * Get product price history
 * @param {string} productId - Product ID
 * @returns {Promise<Array>} - Price history data points
 */
export const getPriceHistory = async (productId) => {
  try {
    const response = await api.get(`/api/products/${productId}/price-history`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching price history for ${productId}:`, error);
    throw error;
  }
};

/**
 * Get product reviews
 * @param {string} productId - Product ID
 * @param {object} options - Pagination and sorting options
 * @returns {Promise<object>} - Reviews data with pagination info
 */
export const getProductReviews = async (productId, options = {}) => {
  try {
    const { page = 1, limit = 10, sort = 'newest' } = options;
    const response = await api.get(
      `/api/products/${productId}/reviews?page=${page}&limit=${limit}&sort=${sort}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching reviews for ${productId}:`, error);
    throw error;
  }
};
