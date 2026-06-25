import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('optimas_meet_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Silent session verification on bootstrap / token updates
  const verifySession = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await authService.getCurrentUser();
      if (result.success) {
        setUser(result.data);
      } else {
        // Fallback for failed check
        handleLogout();
      }
    } catch (error) {
      console.error('[AuthContext] Session validation failed:', error.message || error);
      // Only delete token if it was a definitive client/auth rejection (like 401/403)
      if (error.success === false) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  // Authenticate user
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      if (result.success) {
        const { user: userData, token: authToken } = result.data;
        localStorage.setItem('optimas_meet_token', authToken);
        setToken(authToken);
        setUser(userData);
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error('[AuthContext] Login request rejected:', error);
      return { success: false, error: error.message || 'Server connection failed' };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up a new user profile
  const register = async (name, email, password) => {
    setIsLoading(true);
    try {
      const result = await authService.register(name, email, password);
      if (result.success) {
        const { user: userData, token: authToken } = result.data;
        localStorage.setItem('optimas_meet_token', authToken);
        setToken(authToken);
        setUser(userData);
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error('[AuthContext] Registration request rejected:', error);
      return { success: false, error: error.message || 'Server connection failed' };
    } finally {
      setIsLoading(false);
    }
  };

  // Log out session
  const handleLogout = useCallback(() => {
    localStorage.removeItem('optimas_meet_token');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
