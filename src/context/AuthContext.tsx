/**
 * Authentication Context Provider
 * Manages global authentication state and provides auth methods
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'instructor' | 'student';
  avatar_url?: string;
  studentId?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'instructor' | 'student';
  instructorId?: string;
}

interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Methods
  login: (data: LoginData) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshAuth: () => Promise<boolean>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuthStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (!user) return;

    // Refresh token every 90 minutes (before 2-hour expiry)
    const interval = setInterval(() => {
      refreshAuth();
    }, 90 * 60 * 1000); // 90 minutes

    return () => clearInterval(interval);
  }, [user]);

  // Check authentication status
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Verify token with backend
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token is invalid, try to refresh
        const refreshed = await refreshAuth();
        if (!refreshed) {
          localStorage.removeItem('accessToken');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('accessToken');
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (data: LoginData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include', // Include cookies for refresh token
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('[Auth] Login successful, saving token...');
        console.log('[Auth] Token preview:', result.accessToken ? `${result.accessToken.substring(0, 20)}...` : 'NO TOKEN IN RESPONSE');
        setUser(result.user);
        localStorage.setItem('accessToken', result.accessToken);
        console.log('[Auth] Token saved to localStorage');
        console.log('[Auth] Verification - token in storage:', localStorage.getItem('accessToken') ? 'YES' : 'NO');
        return true;
      } else {
        setError(result.error || 'Login failed');
        return false;
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include', // Include cookies for refresh token
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUser(result.user);
        localStorage.setItem('accessToken', result.accessToken);
        return true;
      } else {
        setError(result.error || 'Registration failed');
        return false;
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Call logout endpoint to invalidate refresh token
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      localStorage.removeItem('accessToken');
      setIsLoading(false);
    }
  };

  // Refresh authentication
  const refreshAuth = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUser(result.user);
          localStorage.setItem('accessToken', result.accessToken);
          return true;
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    
    // Refresh failed, clear auth state
    setUser(null);
    localStorage.removeItem('accessToken');
    return false;
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Note: Token refresh is handled individually in API calls
  // In a production app, you might want to set up global response interceptors

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};