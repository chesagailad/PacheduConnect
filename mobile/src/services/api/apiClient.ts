import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { AppError, ErrorCode, ErrorHandler, getRetryDelay, isRetryableError } from '../../utils/errors';

// API Configuration
const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

// Request/Response Interfaces
export interface ApiRequestConfig extends AxiosRequestConfig {
  retryAttempts?: number;
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

// API Client Class
export class ApiClient {
  private static instance: ApiClient;
  private client: AxiosInstance;
  private errorHandler: ErrorHandler;
  private isRefreshingToken = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
    this.client = this.createAxiosInstance();
    this.setupInterceptors();
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  private setupInterceptors(): void {
    // Request Interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Check network connectivity
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
          throw AppError.fromNetworkError(new Error('No internet connection'));
        }

        // Add authentication token
        if (!(config as any).skipAuth) {
          const token = await this.getAuthToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // Add request timestamp
        config.headers['X-Request-Timestamp'] = Date.now().toString();

        return config;
      },
      (error) => {
        this.errorHandler.handleError(AppError.fromNetworkError(error));
        return Promise.reject(error);
      }
    );

    // Response Interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshingToken) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            });
          }

          originalRequest._retry = true;
          this.isRefreshingToken = true;

          try {
            const newToken = await this.refreshToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              this.processQueue(null, newToken);
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.handleLogout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshingToken = false;
          }
        }

        // Handle other errors
        const appError = this.handleApiError(error);
        if (!originalRequest.skipErrorHandling) {
          this.errorHandler.handleError(appError);
        }

        return Promise.reject(appError);
      }
    );
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.client.post('/auth/refresh-token', {
        refreshToken,
      });

      const { token } = response.data;
      await SecureStore.setItemAsync('auth_token', token);
      return token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  private processQueue(error: any, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private handleApiError(error: AxiosError): AppError {
    if (error.code === 'ECONNABORTED') {
      return AppError.fromNetworkError({
        code: ErrorCode.TIMEOUT_ERROR,
        message: 'Request timeout',
        retryable: true,
        userMessage: 'Request timed out. Please try again.',
        timestamp: new Date(),
      });
    }

    if (!error.response) {
      return AppError.fromNetworkError({
        code: ErrorCode.NETWORK_ERROR,
        message: 'Network error',
        retryable: true,
        userMessage: 'Please check your internet connection and try again.',
        timestamp: new Date(),
      });
    }

    const { status, data } = error.response;

    switch (status) {
      case 400:
        return AppError.fromValidationError(
          'request',
          data?.message || 'Invalid request'
        );
      case 401:
        return AppError.fromAuthError({
          code: ErrorCode.TOKEN_EXPIRED,
          message: 'Token expired',
          retryable: false,
          userMessage: 'Your session has expired. Please log in again.',
          timestamp: new Date(),
        });
      case 403:
        return AppError.fromBusinessError(
          ErrorCode.FORBIDDEN,
          'Access denied',
          'You do not have permission to perform this action'
        );
      case 404:
        return AppError.fromBusinessError(
          ErrorCode.NOT_FOUND,
          'Resource not found',
          'The requested resource was not found'
        );
      case 429:
        return AppError.fromBusinessError(
          ErrorCode.RATE_LIMIT_EXCEEDED,
          'Rate limit exceeded',
          'Too many requests. Please wait a moment before trying again.'
        );
      case 500:
        return AppError.fromServerError({
          code: ErrorCode.SERVER_ERROR,
          message: 'Internal server error',
          retryable: true,
          userMessage: 'Something went wrong. Please try again later.',
          timestamp: new Date(),
        });
      case 503:
        return AppError.fromBusinessError(
          ErrorCode.SERVICE_UNAVAILABLE,
          'Service unavailable',
          'Service is temporarily unavailable. Please try again later.'
        );
      default:
        return AppError.fromServerError({
          code: ErrorCode.UNKNOWN_ERROR,
          message: `HTTP ${status} error`,
          retryable: status >= 500,
          userMessage: 'An unexpected error occurred. Please try again.',
          timestamp: new Date(),
        });
    }
  }

  private async handleLogout(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('user_data');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  // Public API Methods with Retry Logic
  async request<T = any>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    const maxRetries = config.retryAttempts || API_CONFIG.retryAttempts;
    let lastError: AppError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.request(config);
        return {
          data: response.data,
          success: true,
          message: (response.data as any)?.message,
        };
      } catch (error) {
        lastError = error as AppError;

        // Don't retry if error is not retryable or max attempts reached
        if (!isRetryableError(lastError) || attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retrying
        const delay = getRetryDelay(lastError, attempt);
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  async get<T = any>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request({ ...config, method: 'GET', url });
  }

  async post<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request({ ...config, method: 'POST', url, data });
  }

  async put<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request({ ...config, method: 'PUT', url, data });
  }

  async patch<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request({ ...config, method: 'PATCH', url, data });
  }

  async delete<T = any>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request({ ...config, method: 'DELETE', url });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health');
      return response.success;
    } catch (error) {
      return false;
    }
  }

  // Network Status
  async isNetworkAvailable(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? false;
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance(); 