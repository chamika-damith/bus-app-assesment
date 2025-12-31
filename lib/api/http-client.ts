import { 
  HTTPClientConfig, 
  RequestConfig, 
  ResponseData, 
  RequestInterceptor, 
  ResponseInterceptor 
} from './types';
import { TokenManager } from './storage';

// ==================== HTTP CLIENT ERROR CLASSES ====================

export class HTTPError extends Error {
  public status: number;
  public statusText: string;
  public data: any;

  constructor(message: string, status: number, statusText: string, data?: any) {
    super(message);
    this.name = 'HTTPError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// ==================== HTTP CLIENT IMPLEMENTATION ====================

export class HTTPClient {
  private config: HTTPClientConfig;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(config: HTTPClientConfig) {
    this.config = {
      timeout: 10000, // 10 seconds default
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...config,
    };
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Apply request interceptors
   */
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config;

    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onRequest) {
        try {
          processedConfig = await interceptor.onRequest(processedConfig);
        } catch (error) {
          if (interceptor.onRequestError) {
            throw await interceptor.onRequestError(error);
          }
          throw error;
        }
      }
    }

    return processedConfig;
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors<T>(response: ResponseData<T>): Promise<ResponseData<T>> {
    let processedResponse = response;

    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onResponse) {
        try {
          processedResponse = await interceptor.onResponse(processedResponse);
        } catch (error) {
          if (interceptor.onResponseError) {
            throw await interceptor.onResponseError(error);
          }
          throw error;
        }
      }
    }

    return processedResponse;
  }

  /**
   * Handle network errors through interceptors
   */
  private async handleResponseError(error: any): Promise<never> {
    // Log network errors for debugging
    if (__DEV__) {
      console.error('API Request Error:', error);
    }

    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onResponseError) {
        try {
          throw await interceptor.onResponseError(error);
        } catch (interceptedError) {
          throw interceptedError;
        }
      }
    }
    throw error;
  }

  /**
   * Build full URL
   */
  private buildURL(url: string, params?: Record<string, string>): string {
    const fullURL = url.startsWith('http') ? url : `${this.config.baseURL}${url}`;
    
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      return `${fullURL}?${searchParams.toString()}`;
    }
    
    return fullURL;
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(`Request timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Make HTTP request
   */
  async request<T = any>(requestConfig: RequestConfig): Promise<ResponseData<T>> {
    try {
      // Apply request interceptors
      const processedConfig = await this.applyRequestInterceptors(requestConfig);

      // Build request
      const url = this.buildURL(processedConfig.url, processedConfig.params);
      const headers = {
        ...this.config.headers,
        ...processedConfig.headers,
      };

      const fetchOptions: RequestInit = {
        method: processedConfig.method,
        headers,
      };

      // Add body for POST/PUT requests
      if (processedConfig.data && ['POST', 'PUT'].includes(processedConfig.method)) {
        fetchOptions.body = JSON.stringify(processedConfig.data);
      }

      // Create fetch promise with timeout
      const fetchPromise = fetch(url, fetchOptions);
      const timeoutPromise = this.createTimeoutPromise(this.config.timeout || 10000);

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      // Parse response
      let data: T;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text() as any;
      }

      // Convert headers to object
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const responseData: ResponseData<T> = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      };

      // Handle HTTP errors
      if (!response.ok) {
        const error = new HTTPError(
          `HTTP Error: ${response.status} ${response.statusText}`,
          response.status,
          response.statusText,
          data
        );
        return await this.handleResponseError(error);
      }

      // Apply response interceptors
      return await this.applyResponseInterceptors(responseData);

    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new NetworkError('Network request failed. Please check your connection and ensure the backend server is running.');
        return await this.handleResponseError(networkError);
      }

      // Handle network request failed specifically
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        const networkError = new NetworkError('Cannot connect to server. Please check if the backend is running on the correct port.');
        return await this.handleResponseError(networkError);
      }

      // Re-throw other errors (including intercepted ones)
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, params?: Record<string, string>, headers?: Record<string, string>): Promise<ResponseData<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      params,
      headers,
    });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ResponseData<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      headers,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ResponseData<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      headers,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<ResponseData<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
      headers,
    });
  }
}

// ==================== AUTHENTICATED HTTP CLIENT ====================

export class AuthenticatedHTTPClient extends HTTPClient {
  constructor(config: HTTPClientConfig) {
    super(config);
    this.setupAuthInterceptors();
  }

  /**
   * Setup authentication interceptors
   */
  private setupAuthInterceptors(): void {
    // Request interceptor to add auth token
    this.addRequestInterceptor({
      onRequest: async (config) => {
        const token = await TokenManager.getAuthToken();
        if (token) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`,
          };
        }
        return config;
      },
      onRequestError: (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      },
    });

    // Response interceptor to handle auth errors
    this.addResponseInterceptor({
      onResponse: (response) => {
        return response;
      },
      onResponseError: async (error) => {
        if (error instanceof HTTPError && error.status === 401) {
          // Token expired or invalid
          await TokenManager.clearTokens();
          
          // You might want to emit an event here to trigger re-authentication
          // For now, we'll just re-throw the error
          throw new HTTPError(
            'Authentication failed. Please log in again.',
            401,
            'Unauthorized',
            error.data
          );
        }
        
        throw error;
      },
    });
  }

  /**
   * Refresh authentication token
   */
  async refreshAuthToken(): Promise<boolean> {
    try {
      const refreshToken = await TokenManager.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      // Make refresh token request
      const response = await this.post('/api/auth/refresh', {
        refreshToken,
      });

      if (response.data.success && response.data.token) {
        await TokenManager.setTokens(
          response.data.token,
          response.data.refreshToken
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await TokenManager.clearTokens();
      return false;
    }
  }
}

// ==================== FACTORY FUNCTIONS ====================

/**
 * Create HTTP client instance
 */
export function createHTTPClient(config: HTTPClientConfig): HTTPClient {
  return new HTTPClient(config);
}

/**
 * Create authenticated HTTP client instance
 */
export function createAuthenticatedHTTPClient(config: HTTPClientConfig): AuthenticatedHTTPClient {
  return new AuthenticatedHTTPClient(config);
}