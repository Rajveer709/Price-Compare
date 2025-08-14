// Auth utility functions for handling authentication state

// Key for storing auth token in localStorage
const AUTH_TOKEN_KEY = 'price_compare_auth_token';
const USER_DATA_KEY = 'price_compare_user_data';

/**
 * Save authentication token to localStorage
 * @param {string} token - JWT token
 */
export const setAuthToken = (token) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      // Set default Authorization header for axios
      if (token) {
        // This will be used by the axios instance in api.js
        // The interceptor will pick it up from localStorage
        return true;
      }
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  }
  return false;
};

/**
 * Get authentication token from localStorage
 * @returns {string|null} JWT token or null if not found
 */
export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
  }
  return null;
};

/**
 * Remove authentication token from localStorage
 */
export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return true;
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  }
  return false;
};

/**
 * Save user data to localStorage
 * @param {object} userData - User data object
 */
export const setUserData = (userData) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }
  return false;
};

/**
 * Get user data from localStorage
 * @returns {object|null} User data object or null if not found
 */
export const getUserData = () => {
  if (typeof window !== 'undefined') {
    try {
      const userData = localStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
    }
  }
  return null;
};

/**
 * Remove user data from localStorage
 */
export const removeUserData = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(USER_DATA_KEY);
      return true;
    } catch (error) {
      console.error('Error removing user data:', error);
    }
  }
  return false;
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
export const isAuthenticated = () => {
  const token = getAuthToken();
  if (!token) return false;
  
  // Optional: Add token expiration check here
  // You would decode the JWT and check the expiration time
  
  return true;
};

/**
 * Logout user by removing auth data
 */
export const logout = () => {
  removeAuthToken();
  removeUserData();
  // Clear any other auth-related data
  if (typeof window !== 'undefined') {
    // Clear any other auth-related items
    const keysToRemove = [];
    
    // Add any other auth-related keys here
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('auth_') || key.includes('session')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error removing ${key}:`, error);
      }
    });
  }
};

/**
 * Get authorization header for API requests
 * @returns {object} Authorization header or empty object if not authenticated
 */
export const getAuthHeader = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Check if the current user has a specific role
 * @param {string|string[]} roles - Role or array of roles to check against
 * @returns {boolean} True if user has the required role(s)
 */
export const hasRole = (roles) => {
  const user = getUserData();
  if (!user || !user.roles) return false;
  
  const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  
  return requiredRoles.some(role => userRoles.includes(role));
};

/**
 * Check if the current user has a specific permission
 * @param {string|string[]} permissions - Permission or array of permissions to check against
 * @returns {boolean} True if user has the required permission(s)
 */
export const hasPermission = (permissions) => {
  const user = getUserData();
  if (!user || !user.permissions) return false;
  
  const userPermissions = Array.isArray(user.permissions) ? user.permissions : [user.permissions];
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
  
  return requiredPermissions.every(permission => userPermissions.includes(permission));
};
