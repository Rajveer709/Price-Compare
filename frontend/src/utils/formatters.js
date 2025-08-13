/**
 * Utility functions for formatting data in the frontend
 */

/**
 * Format price with currency symbol
 * @param {number} price - The price value
 * @param {string} currency - Currency code (default: 'USD')
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, currency = 'USD', locale = 'en-US') => {
  if (typeof price !== 'number' || isNaN(price)) {
    return '$0.00';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } catch (error) {
    console.error('Error formatting price:', error);
    return `$${price.toFixed(2)}`;
  }
};

/**
 * Format large numbers with abbreviations (K, M, B)
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (num) => {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }

  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Format date to relative time (e.g., "2 hours ago")
 * @param {Date|string} date - The date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  try {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((now - targetDate) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Unknown';
  }
};

/**
 * Format date to readable string
 * @param {Date|string} date - The date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  try {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    };

    return new Intl.DateTimeFormat('en-US', defaultOptions).format(new Date(date));
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Calculate discount percentage
 * @param {number} originalPrice - Original price
 * @param {number} currentPrice - Current price
 * @returns {number} Discount percentage (rounded to 1 decimal place)
 */
export const calculateDiscount = (originalPrice, currentPrice) => {
  if (!originalPrice || !currentPrice || originalPrice <= currentPrice) {
    return 0;
  }

  const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
  return Math.round(discount * 10) / 10; // Round to 1 decimal place
};

/**
 * Calculate savings amount
 * @param {number} originalPrice - Original price
 * @param {number} currentPrice - Current price
 * @returns {number} Savings amount
 */
export const calculateSavings = (originalPrice, currentPrice) => {
  if (!originalPrice || !currentPrice || originalPrice <= currentPrice) {
    return 0;
  }

  return originalPrice - currentPrice;
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength, suffix = '...') => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Format seller rating display
 * @param {number} rating - Rating value (0-5)
 * @param {number} reviewCount - Number of reviews
 * @returns {object} Formatted rating info
 */
export const formatRating = (rating, reviewCount = 0) => {
  const formattedRating = Math.round(rating * 10) / 10; // Round to 1 decimal
  const stars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return {
    rating: formattedRating,
    stars,
    hasHalfStar,
    reviewCount: formatNumber(reviewCount),
    display: `${formattedRating} (${formatNumber(reviewCount)} reviews)`,
  };
};

/**
 * Format shipping information
 * @param {object} shipping - Shipping object with cost and time
 * @returns {string} Formatted shipping string
 */
export const formatShipping = (shipping) => {
  if (!shipping) {
    return 'Shipping info unavailable';
  }

  const { cost, time, method } = shipping;
  const shippingCost = cost === 0 ? 'Free' : formatPrice(cost);
  const shippingTime = time || 'Standard delivery';
  
  return `${shippingCost} shipping • ${shippingTime}`;
};

/**
 * Format product condition with appropriate styling info
 * @param {string} condition - Product condition
 * @returns {object} Condition info with color scheme
 */
export const formatCondition = (condition) => {
  const conditionMap = {
    'New': { label: 'New', colorScheme: 'green' },
    'Used': { label: 'Used', colorScheme: 'yellow' },
    'Refurbished': { label: 'Refurbished', colorScheme: 'blue' },
    'For parts or not working': { label: 'For Parts', colorScheme: 'red' },
  };

  return conditionMap[condition] || { label: condition, colorScheme: 'gray' };
};

/**
 * Generate search suggestions based on query
 * @param {string} query - Search query
 * @param {array} history - Search history
 * @returns {array} Suggested search terms
 */
export const generateSearchSuggestions = (query, history = []) => {
  if (!query || query.length < 2) {
    return history.slice(0, 5);
  }

  const suggestions = [
    ...history.filter(term => 
      term.toLowerCase().includes(query.toLowerCase()) && term !== query
    ),
  ].slice(0, 5);

  return suggestions;
};

export default {
  formatPrice,
  formatNumber,
  formatRelativeTime,
  formatDate,
  calculateDiscount,
  calculateSavings,
  truncateText,
  formatRating,
  formatShipping,
  formatCondition,
  generateSearchSuggestions,
};