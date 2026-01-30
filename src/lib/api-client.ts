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
  private accessToken: string | null = null;

  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }

  // Method to set the access token
  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  // Method to get the current access token
  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      // Build headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if token exists
      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      } else {
        console.warn('[API Client] Access token missing for request:', endpoint);
      }
      
      // Merge with any additional headers from options
      if (options.headers) {
        Object.assign(headers, options.headers);
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        // If 401, token might be expired - just log, let context handle it
        if (response.status === 401) {
          console.error('[API Client] 401 Unauthorized for:', endpoint);
        }
        
        // Try to parse error response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Failed to parse error response, use default message
        }
        
        throw new ApiError(
          errorMessage,
          response.status
        );
      }

      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      console.error('[API Client] Request failed:', endpoint, error);
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