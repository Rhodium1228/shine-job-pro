/**
 * API Client for BMS Pro
 * Centralized service for all API communications
 */

const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

interface ApiClientConfig {
  token?: string | null;
  onTokenExpired?: () => void;
}

class ApiClient {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private onTokenExpired?: () => void;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor(config?: ApiClientConfig) {
    this.token = config?.token || null;
    this.onTokenExpired = config?.onTokenExpired;
    
    // Load tokens from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('api_token');
      this.refreshToken = localStorage.getItem('api_refresh_token');
    }
  }

  setTokens(token: string, refreshToken: string) {
    this.token = token;
    this.refreshToken = refreshToken;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('api_token', token);
      localStorage.setItem('api_refresh_token', refreshToken);
    }
  }

  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('api_token');
      localStorage.removeItem('api_refresh_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api-v1-auth-refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        this.setTokens(data.token, data.refreshToken);
        return data.token;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token expiration
    if (response.status === 401 && this.refreshToken && !endpoint.includes('auth')) {
      try {
        const newToken = await this.refreshAccessToken();
        headers['Authorization'] = `Bearer ${newToken}`;
        
        // Retry the request with new token
        response = await fetch(url, {
          ...options,
          headers,
        });
      } catch (error) {
        // Refresh failed, trigger logout
        this.clearTokens();
        this.onTokenExpired?.();
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const data = await this.request<{
      token: string;
      refreshToken: string;
      user: any;
      role: string | null;
      branchIds: string[];
      defaultBranch: string;
    }>('api-v1-auth-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.setTokens(data.token, data.refreshToken);
    return data;
  }

  async logout() {
    try {
      await this.request('api-v1-auth-logout', { method: 'POST' });
    } finally {
      this.clearTokens();
    }
  }

  async getSession() {
    return this.request<{
      user: { id: string; email: string };
      role: string | null;
      branchIds: string[];
    }>('api-v1-auth-session');
  }

  // Helper methods for common HTTP methods
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = params 
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T = any>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient({
  onTokenExpired: () => {
    // Redirect to login when token expires
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
  },
});

export default apiClient;
