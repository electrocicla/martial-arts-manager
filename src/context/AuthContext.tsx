/**
 * Authentication Context Provider
 * Manages global authentication state and provides auth methods
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '../lib/api-client';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'instructor' | 'student';
  avatar_url?: string;
  student_id?: string;
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
  accessToken: string | null;

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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuthStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync accessToken with apiClient whenever it changes
  useEffect(() => {
    apiClient.setAccessToken(accessToken);
  }, [accessToken]);

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
      // Try to refresh immediately using HttpOnly cookie since we don't store access token in localStorage anymore
      const success = await refreshAuth();
      if (!success) {
        // No valid refresh token found - clear state
        console.log('[Auth] No valid refresh token, clearing auth state');
        setUser(null);
        setAccessToken(null);
        apiClient.setAccessToken(null);
      }
    } catch (error) {
      console.error('[Auth] Auth check failed:', error);
      setUser(null);
      setAccessToken(null);
      apiClient.setAccessToken(null);
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
        setUser(result.user);
        setAccessToken(result.accessToken);
        // Immediately sync token with apiClient to avoid race conditions
        apiClient.setAccessToken(result.accessToken);
        // Flag a successful login so we can trigger Android APK prompt once
        try {
          sessionStorage.setItem('hamarr:just-logged-in', Date.now().toString());
        } catch {
          // ignore storage errors (private mode, browser restrictions)
        }
        return true;
      } else {
        // Check if it's a pending approval error
        if (result.code === 'PENDING_APPROVAL') {
          setError('PENDING_APPROVAL'); // Special error code for UI handling
        } else {
          setError(result.error || 'Login failed');
        }
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
        setAccessToken(result.accessToken);
        // Immediately sync token with apiClient to avoid race conditions
        apiClient.setAccessToken(result.accessToken);
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
      setAccessToken(null);
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
          setAccessToken(result.accessToken);
          return true;
        }
      }
      
      // Only clear auth if we got a 401 (unauthorized) response
      // Other errors (network, 5xx) should not log the user out
      if (response.status === 401) {
        setUser(null);
        setAccessToken(null);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Network error - don't log user out, token might still be valid
    }
    
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
    accessToken,
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