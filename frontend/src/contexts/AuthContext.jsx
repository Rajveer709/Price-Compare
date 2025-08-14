import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import { getAuthToken, setAuthToken, setUserData, getUserData, removeAuthToken, removeUserData } from '../utils/auth';

// Create the authentication context
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: () => {},
});

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is already authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getAuthToken();
        if (token) {
          // If we have a token, try to fetch the user profile
          const userData = await userService.getProfile();
          setUser(userData);
          setIsAuthenticated(true);
          setUserData(userData); // Update stored user data
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid auth data
        removeAuthToken();
        removeUserData();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      setIsLoading(true);
      const { token, user: userData } = await userService.login(credentials);
      
      // Store the token and user data
      setAuthToken(token);
      setUserData(userData);
      
      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed. Please check your credentials.' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      const { token, user: userData } = await userService.register(userData);
      
      // Store the token and user data
      setAuthToken(token);
      setUserData(userData);
      
      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed. Please try again.' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    // Clear auth data
    removeAuthToken();
    removeUserData();
    
    // Update state
    setUser(null);
    setIsAuthenticated(false);
    
    // Redirect to home page
    navigate('/');
  }, [navigate]);

  // Update user data
  const updateUser = useCallback((updatedUser) => {
    setUser(prevUser => ({
      ...prevUser,
      ...updatedUser,
    }));
    setUserData(updatedUser);
  }, []);

  // Context value
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
