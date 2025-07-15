export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: 'user' | 'admin' | 'super_admin';
  kycLevel: 'bronze' | 'silver' | 'gold';
  kycStatus: 'pending' | 'approved' | 'rejected';
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  fee?: number;
  exchangeRate?: number;
  recipientAmount?: number;
  recipientCurrency?: string;
  sender?: User;
  recipient?: User;
  paymentMethod?: string;
  trackingNumber?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Beneficiary {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  bankName?: string;
  accountNumber?: string;
  accountType?: 'savings' | 'checking' | 'current';
  swiftCode?: string;
  routingNumber?: string;
  country?: string;
  address?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KYC {
  id: string;
  userId: string;
  level: 'bronze' | 'silver' | 'gold';
  status: 'pending' | 'approved' | 'rejected';
  documents: KYCDocument[];
  limits: {
    daily: number;
    monthly: number;
    single: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface KYCDocument {
  id: string;
  type: 'id_document' | 'proof_of_address' | 'proof_of_income';
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  approvedAt?: string;
  fileName?: string;
  fileSize?: number;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: string;
  reference: string;
  paymentUrl?: string;
  expiresAt?: string;
  completedAt?: string;
  transactionId?: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  pendingKYC: number;
  failedTransactions: number;
  revenue: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  transactions: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: Pagination;
}

export interface FilterOptions {
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  role?: 'user' | 'admin' | 'super_admin';
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
  lastLogin?: string;
  createdAt: string;
} 