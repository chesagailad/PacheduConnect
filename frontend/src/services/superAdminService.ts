import axios from 'axios';

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    growth: string;
  };
  kyc: {
    total: number;
    breakdown: {
      bronze: { pending: number; approved: number; rejected: number };
      silver: { pending: number; approved: number; rejected: number };
      gold: { pending: number; approved: number; rejected: number };
    };
    pending: number;
  };
  transactions: {
    total: number;
    monthly: number;
    totalAmount: number;
  };
  payments: {
    total: number;
    successful: number;
    totalAmount: number;
    successRate: string;
  };
  beneficiaries: {
    total: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: 'user' | 'admin' | 'super_admin';
  isActive?: boolean;
  createdAt: string;
  kyc?: any;
}

export interface KYCStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byLevel: {
    bronze: { total: number; pending: number; approved: number; rejected: number };
    silver: { total: number; pending: number; approved: number; rejected: number };
    gold: { total: number; pending: number; approved: number; rejected: number };
  };
}

export interface SystemHealth {
  system: {
    database: string;
    uptime: number;
    memory: any;
    timestamp: string;
  };
  metrics: {
    total: {
      users: number;
      kyc: number;
      transactions: number;
    };
    last24h: {
      newUsers: number;
      newKYC: number;
      newTransactions: number;
    };
  };
}

export interface SystemSettings {
  kycAutoApproval?: boolean;
  maxFileSize?: number;
  maintenanceMode?: boolean;
  registrationEnabled?: boolean;
  kycRequired?: boolean;
}

class SuperAdminService {
  private baseURL = '/api/super-admin';

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await axios.get(`${this.baseURL}/dashboard`, {
        headers: this.getAuthHeaders(),
      });
      return response.data.dashboard;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch dashboard stats');
      }
      throw new Error('Failed to fetch dashboard stats');
    }
  }

  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    kycStatus?: string;
  }): Promise<{ users: User[]; pagination: any }> {
    try {
      const response = await axios.get(`${this.baseURL}/users`, {
        headers: this.getAuthHeaders(),
        params,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch users');
      }
      throw new Error('Failed to fetch users');
    }
  }

  async getUserDetails(userId: string): Promise<{ user: User; statistics: any }> {
    try {
      const response = await axios.get(`${this.baseURL}/users/${userId}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch user details');
      }
      throw new Error('Failed to fetch user details');
    }
  }

  async updateUserRole(userId: string, role: string): Promise<{ message: string; user: User }> {
    try {
      const response = await axios.put(`${this.baseURL}/users/${userId}/role`, 
        { role },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update user role');
      }
      throw new Error('Failed to update user role');
    }
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<{ message: string; user: User }> {
    try {
      const response = await axios.put(`${this.baseURL}/users/${userId}/status`, 
        { isActive },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update user status');
      }
      throw new Error('Failed to update user status');
    }
  }

  async getKYCRecords(params: {
    page?: number;
    limit?: number;
    status?: string;
    level?: string;
    search?: string;
  }): Promise<{ kycRecords: any[]; pagination: any }> {
    try {
      const response = await axios.get(`${this.baseURL}/kyc`, {
        headers: this.getAuthHeaders(),
        params,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch KYC records');
      }
      throw new Error('Failed to fetch KYC records');
    }
  }

  async getKYCStats(): Promise<KYCStats> {
    try {
      const response = await axios.get(`${this.baseURL}/kyc/stats`, {
        headers: this.getAuthHeaders(),
      });
      return response.data.stats;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch KYC stats');
      }
      throw new Error('Failed to fetch KYC stats');
    }
  }

  async approveKYC(kycId: string): Promise<{ message: string; newLevel: string }> {
    try {
      const response = await axios.post(`${this.baseURL}/kyc/${kycId}/approve`, {}, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to approve KYC');
      }
      throw new Error('Failed to approve KYC');
    }
  }

  async rejectKYC(kycId: string, rejectionReason: string): Promise<{ message: string }> {
    try {
      const response = await axios.post(`${this.baseURL}/kyc/${kycId}/reject`, 
        { rejectionReason },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to reject KYC');
      }
      throw new Error('Failed to reject KYC');
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await axios.get(`${this.baseURL}/system/health`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch system health');
      }
      throw new Error('Failed to fetch system health');
    }
  }

  async updateSystemSettings(settings: SystemSettings): Promise<{ message: string; settings: SystemSettings }> {
    try {
      const response = await axios.put(`${this.baseURL}/system/settings`, 
        { settings },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update system settings');
      }
      throw new Error('Failed to update system settings');
    }
  }

  async getLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    userId?: string;
  }): Promise<{ logs: any[]; pagination: any }> {
    try {
      const response = await axios.get(`${this.baseURL}/logs`, {
        headers: this.getAuthHeaders(),
        params,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch logs');
      }
      throw new Error('Failed to fetch logs');
    }
  }
}

export const superAdminService = new SuperAdminService();
export default superAdminService; 