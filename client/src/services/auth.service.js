import api from './api';

export const authService = {
  // Login user and retrieve JWT session
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Server connection error' };
    }
  },

  // Register a new user profile
  register: async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Server connection error' };
    }
  },

  // Validate session token and retrieve verified profile metadata
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Session expired' };
    }
  },
};

export default authService;
