import { apiClient, ApiResponse } from './apiClient';
import { AppError, ErrorCode } from '../../utils/errors';

// Transaction Interfaces
export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'withdrawal' | 'deposit';
  amount: number;
  currency: string;
  recipientId?: string;
  recipientName?: string;
  recipientEmail?: string;
  senderId?: string;
  senderName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  fee: number;
  exchangeRate?: number;
  description?: string;
  reference: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failureReason?: string;
}

export interface CreateTransactionRequest {
  recipientId: string;
  amount: number;
  currency: string;
  description?: string;
  deliveryMethod: 'bank_transfer' | 'ecocash' | 'cash_pickup' | 'home_delivery';
  deliveryDetails: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    country?: string;
  };
}

export interface TransactionFilters {
  type?: 'send' | 'receive' | 'withdrawal' | 'deposit';
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  page?: number;
  limit?: number;
}

export interface TransactionSummary {
  totalSent: number;
  totalReceived: number;
  totalFees: number;
  pendingTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
}

export interface FeeCalculation {
  amount: number;
  currency: string;
  transferFee: number;
  exchangeRate: number;
  totalAmount: number;
  deliveryFee: number;
  estimatedDeliveryTime: string;
}

// Validation Functions
export class TransactionValidator {
  static validateAmount(amount: number, currency: string): void {
    if (amount <= 0) {
      throw AppError.fromValidationError('amount', 'Amount must be greater than 0');
    }

    const minAmounts = {
      ZAR: 10,
      USD: 1,
      EUR: 1,
    };

    const maxAmounts = {
      ZAR: 50000,
      USD: 5000,
      EUR: 5000,
    };

    const minAmount = minAmounts[currency as keyof typeof minAmounts] || 1;
    const maxAmount = maxAmounts[currency as keyof typeof maxAmounts] || 10000;

    if (amount < minAmount) {
      throw AppError.fromValidationError(
        'amount',
        `Minimum amount is ${currency} ${minAmount}`
      );
    }

    if (amount > maxAmount) {
      throw AppError.fromValidationError(
        'amount',
        `Maximum amount is ${currency} ${maxAmount}`
      );
    }
  }

  static validateRecipient(recipientId: string): void {
    if (!recipientId || recipientId.trim().length === 0) {
      throw AppError.fromValidationError('recipient', 'Recipient is required');
    }
  }

  static validateDeliveryMethod(method: string): void {
    const validMethods = ['bank_transfer', 'ecocash', 'cash_pickup', 'home_delivery'];
    if (!validMethods.includes(method)) {
      throw AppError.fromValidationError(
        'deliveryMethod',
        'Invalid delivery method'
      );
    }
  }

  static validateDeliveryDetails(
    method: string,
    details: CreateTransactionRequest['deliveryDetails']
  ): void {
    switch (method) {
      case 'bank_transfer':
        if (!details.bankName || !details.accountNumber || !details.accountName) {
          throw AppError.fromValidationError(
            'deliveryDetails',
            'Bank name, account number, and account name are required for bank transfers'
          );
        }
        break;
      case 'ecocash':
        if (!details.phoneNumber) {
          throw AppError.fromValidationError(
            'deliveryDetails',
            'Phone number is required for EcoCash transfers'
          );
        }
        break;
      case 'home_delivery':
        if (!details.address || !details.city || !details.country) {
          throw AppError.fromValidationError(
            'deliveryDetails',
            'Address, city, and country are required for home delivery'
          );
        }
        break;
    }
  }
}

// Transaction Service Class
export class TransactionService {
  private static instance: TransactionService;

  static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  // Calculate transaction fees
  async calculateFees(
    amount: number,
    currency: string,
    deliveryMethod: string
  ): Promise<FeeCalculation> {
    try {
      TransactionValidator.validateAmount(amount, currency);

      const response = await apiClient.post<FeeCalculation>('/transactions/calculate-fees', {
        amount,
        currency,
        deliveryMethod,
      });

      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Create a new transaction
  async createTransaction(request: CreateTransactionRequest): Promise<Transaction> {
    try {
      // Validate input
      TransactionValidator.validateAmount(request.amount, request.currency);
      TransactionValidator.validateRecipient(request.recipientId);
      TransactionValidator.validateDeliveryMethod(request.deliveryMethod);
      TransactionValidator.validateDeliveryDetails(request.deliveryMethod, request.deliveryDetails);

      const response = await apiClient.post<Transaction>('/transactions', request);
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Get transaction by ID
  async getTransaction(transactionId: string): Promise<Transaction> {
    try {
      if (!transactionId || transactionId.trim().length === 0) {
        throw AppError.fromValidationError('transactionId', 'Transaction ID is required');
      }

      const response = await apiClient.get<Transaction>(`/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Get user's transactions with filters
  async getTransactions(filters: TransactionFilters = {}): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.minAmount) queryParams.append('minAmount', filters.minAmount.toString());
      if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount.toString());
      if (filters.currency) queryParams.append('currency', filters.currency);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const url = `/transactions?${queryParams.toString()}`;
      const response = await apiClient.get<{
        transactions: Transaction[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(url);

      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Get transaction summary
  async getTransactionSummary(): Promise<TransactionSummary> {
    try {
      const response = await apiClient.get<TransactionSummary>('/transactions/summary');
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Cancel a pending transaction
  async cancelTransaction(transactionId: string): Promise<Transaction> {
    try {
      if (!transactionId || transactionId.trim().length === 0) {
        throw AppError.fromValidationError('transactionId', 'Transaction ID is required');
      }

      const response = await apiClient.post<Transaction>(`/transactions/${transactionId}/cancel`);
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Retry a failed transaction
  async retryTransaction(transactionId: string): Promise<Transaction> {
    try {
      if (!transactionId || transactionId.trim().length === 0) {
        throw AppError.fromValidationError('transactionId', 'Transaction ID is required');
      }

      const response = await apiClient.post<Transaction>(`/transactions/${transactionId}/retry`);
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Get transaction status
  async getTransactionStatus(transactionId: string): Promise<{
    status: Transaction['status'];
    lastUpdated: string;
    estimatedCompletion?: string;
  }> {
    try {
      if (!transactionId || transactionId.trim().length === 0) {
        throw AppError.fromValidationError('transactionId', 'Transaction ID is required');
      }

      const response = await apiClient.get<{
        status: Transaction['status'];
        lastUpdated: string;
        estimatedCompletion?: string;
      }>(`/transactions/${transactionId}/status`);

      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Get recent transactions (last 10)
  async getRecentTransactions(): Promise<Transaction[]> {
    try {
      const response = await apiClient.get<Transaction[]>('/transactions/recent');
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Search transactions
  async searchTransactions(query: string): Promise<Transaction[]> {
    try {
      if (!query || query.trim().length === 0) {
        throw AppError.fromValidationError('query', 'Search query is required');
      }

      const response = await apiClient.get<Transaction[]>(`/transactions/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Export transactions
  async exportTransactions(
    format: 'csv' | 'pdf' | 'excel',
    filters: TransactionFilters = {}
  ): Promise<{ downloadUrl: string; expiresAt: string }> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await apiClient.post<{ downloadUrl: string; expiresAt: string }>(
        `/transactions/export?${queryParams.toString()}`
      );

      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }
}

// Export singleton instance
export const transactionService = TransactionService.getInstance(); 