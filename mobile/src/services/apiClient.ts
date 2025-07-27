import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          await SecureStore.deleteItemAsync('auth_token');
          // You can emit an event here to notify the app about auth failure
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic request method
  private async request<T>(config: any): Promise<T> {
    try {
      const response = await this.client(config);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // GET request
  async get<T>(url: string, config?: any): Promise<T> {
    return this.request<T>({ method: 'GET', url, ...config });
  }

  // POST request
  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.request<T>({ method: 'POST', url, data, ...config });
  }

  // PUT request
  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.request<T>({ method: 'PUT', url, data, ...config });
  }

  // DELETE request
  async delete<T>(url: string, config?: any): Promise<T> {
    return this.request<T>({ method: 'DELETE', url, ...config });
  }

  // PATCH request
  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.request<T>({ method: 'PATCH', url, data, ...config });
  }
}

export const apiClient = new ApiClient();
export default apiClient; 