import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, FilterOptions } from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('admin_token');
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
      (error) => {
        if (error.response?.status === 401) {
          // Redirect to login if unauthorized
          localStorage.removeItem('admin_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic request method
  private async request<T>(config: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client(config);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: '/api/auth/admin/login',
      data: { email, password },
    });
  }

  async logout(): Promise<void> {
    localStorage.removeItem('admin_token');
  }

  // Get current authenticated user
  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: '/api/auth/me',
    });
  }

  // Dashboard
  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: '/api/admin/dashboard/stats',
    });
  }

  // Users
  async getUsers(filters?: FilterOptions): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    return this.request({
      method: 'GET',
      url: `/api/admin/users?${params.toString()}`,
    });
  }

  async getUser(id: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: `/api/admin/users/${id}`,
    });
  }

  async updateUser(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request({
      method: 'PUT',
      url: `/api/admin/users/${id}`,
      data,
    });
  }

  async suspendUser(id: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'PUT',
      url: `/api/admin/users/${id}/suspend`,
    });
  }

  async activateUser(id: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'PUT',
      url: `/api/admin/users/${id}/activate`,
    });
  }

  // Transactions
  async getTransactions(filters?: FilterOptions): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    return this.request({
      method: 'GET',
      url: `/api/admin/transactions?${params.toString()}`,
    });
  }

  async getTransaction(id: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: `/api/admin/transactions/${id}`,
    });
  }

  async updateTransaction(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request({
      method: 'PUT',
      url: `/api/admin/transactions/${id}`,
      data,
    });
  }

  // KYC
  async getKYCRequests(filters?: FilterOptions): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    return this.request({
      method: 'GET',
      url: `/api/admin/kyc?${params.toString()}`,
    });
  }

  async getKYCRequest(id: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: `/api/admin/kyc/${id}`,
    });
  }

  async approveKYC(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request({
      method: 'PUT',
      url: `/api/admin/users/${id}/kyc`,
      data: { ...data, status: 'approved' },
    });
  }

  async rejectKYC(id: string, reason: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'PUT',
      url: `/api/admin/users/${id}/kyc`,
      data: { status: 'rejected', notes: reason },
    });
  }

  // Payments
  async getPayments(filters?: FilterOptions): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    return this.request({
      method: 'GET',
      url: `/api/admin/payments?${params.toString()}`,
    });
  }

  async getPayment(id: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: `/api/admin/payments/${id}`,
    });
  }

  // Reports
  async getReports(type: string, filters?: FilterOptions): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    return this.request({
      method: 'GET',
      url: `/api/admin/reports/${type}?${params.toString()}`,
    });
  }

  // Analytics
  async getAnalytics(period: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: `/api/admin/analytics?period=${period}`,
    });
  }

  // Settings
  async getSettings(): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: '/api/admin/settings',
    });
  }

  async updateSettings(data: any): Promise<ApiResponse<any>> {
    return this.request({
      method: 'PUT',
      url: '/api/admin/settings',
      data,
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient; 