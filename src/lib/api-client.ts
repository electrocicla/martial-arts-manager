/**
 * API Service Layer
 * Provides a clean abstraction over HTTP requests with proper error handling
 * Follows Dependency Inversion Principle by depending on abstractions
 */

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ApiError extends Error {
  public status: number;
  public code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export class ApiClient {
  private baseURL: string;

  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      // Get token from localStorage
      const token = localStorage.getItem('accessToken');
      
      // DEBUG: Log token status
      console.log('[API Client] Making request to:', endpoint);
      console.log('[API Client] Token exists:', !!token);
      console.log('[API Client] Token preview:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      
      // Build headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('[API Client] Authorization header added');
      } else {
        console.warn('[API Client] NO TOKEN FOUND IN LOCALSTORAGE!');
      }
      
      // Merge with any additional headers from options
      if (options.headers) {
        Object.assign(headers, options.headers);
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('[API Client] Response status:', response.status);

      if (!response.ok) {
        // If 401, token might be expired - trigger logout
        if (response.status === 401) {
          console.error('[API Client] 401 Unauthorized - removing token and redirecting');
          localStorage.removeItem('accessToken');
          // Redirect to login if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      console.error('[API Client] Request failed:', error);
      if (error instanceof ApiError) {
        return { error: error.message, success: false };
      }

      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();