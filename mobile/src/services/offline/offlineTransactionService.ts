import { transactionService } from '../api/transactionService';
import { offlineManager, OfflineTransaction } from './offlineManager';
import { AppError, ErrorCode } from '../../utils/errors';

// Offline Transaction Service Interfaces
export interface OfflineTransactionRequest {
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

export interface OfflineTransactionResult {
  success: boolean;
  transactionId: string;
  isOffline: boolean;
  message: string;
}

// Offline Transaction Service Class
export class OfflineTransactionService {
  private static instance: OfflineTransactionService;

  static getInstance(): OfflineTransactionService {
    if (!OfflineTransactionService.instance) {
      OfflineTransactionService.instance = new OfflineTransactionService();
    }
    return OfflineTransactionService.instance;
  }

  // Create transaction with offline support
  async createTransaction(request: OfflineTransactionRequest): Promise<OfflineTransactionResult> {
    try {
      // Check if device is online
      const isOnline = offlineManager.isDeviceOnline();

      if (isOnline) {
        // Try to create transaction online
        try {
          const transaction = await transactionService.createTransaction(request);
          
          return {
            success: true,
            transactionId: transaction.id,
            isOffline: false,
            message: 'Transaction created successfully',
          };
        } catch (error) {
          // If online creation fails, fall back to offline storage
          console.log('Online transaction failed, storing offline:', error);
          return this.storeOfflineTransaction(request);
        }
      } else {
        // Device is offline, store transaction locally
        return this.storeOfflineTransaction(request);
      }
    } catch (error) {
      console.error('Failed to create transaction:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw AppError.fromBusinessError(
        ErrorCode.TRANSACTION_FAILED,
        'Failed to create transaction',
        'Please try again later'
      );
    }
  }

  // Store transaction offline
  private async storeOfflineTransaction(request: OfflineTransactionRequest): Promise<OfflineTransactionResult> {
    try {
      const offlineTransaction: Omit<OfflineTransaction, 'id' | 'status' | 'createdAt' | 'retryCount'> = {
        type: 'send',
        amount: request.amount,
        currency: request.currency,
        recipientId: request.recipientId,
        description: request.description,
        deliveryMethod: request.deliveryMethod,
        deliveryDetails: request.deliveryDetails,
        maxRetries: 3,
      };

      const transactionId = await offlineManager.storeOfflineTransaction(offlineTransaction);

      return {
        success: true,
        transactionId,
        isOffline: true,
        message: 'Transaction stored offline and will be processed when online',
      };
    } catch (error) {
      console.error('Failed to store offline transaction:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw AppError.fromBusinessError(
        ErrorCode.STORAGE_ERROR,
        'Failed to store offline transaction',
        'Please check your device storage and try again'
      );
    }
  }

  // Get all transactions (online + offline)
  async getTransactions(filters?: any): Promise<{
    transactions: any[];
    total: number;
    offlineCount: number;
  }> {
    try {
      const isOnline = offlineManager.isDeviceOnline();
      const offlineTransactions = await offlineManager.getOfflineTransactions();

      let onlineTransactions: any[] = [];
      let onlineTotal = 0;

      if (isOnline) {
        try {
          const onlineResult = await transactionService.getTransactions(filters);
          onlineTransactions = onlineResult.transactions;
          onlineTotal = onlineResult.total;
        } catch (error) {
          console.log('Failed to fetch online transactions, using offline data only:', error);
        }
      }

      // Merge online and offline transactions
      const allTransactions = [...onlineTransactions, ...offlineTransactions];
      
      // Sort by creation date (newest first)
      allTransactions.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.syncedAt || 0);
        const dateB = new Date(b.createdAt || b.syncedAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      return {
        transactions: allTransactions,
        total: onlineTotal + offlineTransactions.length,
        offlineCount: offlineTransactions.length,
      };
    } catch (error) {
      console.error('Failed to get transactions:', error);
      
      // Return offline transactions only if online fetch fails
      const offlineTransactions = await offlineManager.getOfflineTransactions();
      
      return {
        transactions: offlineTransactions,
        total: offlineTransactions.length,
        offlineCount: offlineTransactions.length,
      };
    }
  }

  // Get transaction by ID
  async getTransaction(transactionId: string): Promise<any> {
    try {
      // Check if it's an offline transaction
      if (transactionId.startsWith('offline_')) {
        const offlineTransactions = await offlineManager.getOfflineTransactions();
        const offlineTransaction = offlineTransactions.find(t => t.id === transactionId);
        
        if (offlineTransaction) {
          return offlineTransaction;
        }
        
        throw AppError.fromBusinessError(
          ErrorCode.NOT_FOUND,
          'Offline transaction not found',
          'Transaction may have been synced or deleted'
        );
      }

      // Try to get online transaction
      const isOnline = offlineManager.isDeviceOnline();
      
      if (isOnline) {
        try {
          return await transactionService.getTransaction(transactionId);
        } catch (error) {
          console.log('Failed to fetch online transaction:', error);
          throw error;
        }
      } else {
        throw AppError.fromBusinessError(
          ErrorCode.NETWORK_ERROR,
          'Cannot fetch transaction while offline',
          'Please check your internet connection and try again'
        );
      }
    } catch (error) {
      console.error('Failed to get transaction:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw AppError.fromBusinessError(
        ErrorCode.TRANSACTION_FAILED,
        'Failed to get transaction',
        'Please try again later'
      );
    }
  }

  // Calculate fees with offline support
  async calculateFees(amount: number, currency: string, deliveryMethod: string): Promise<any> {
    try {
      const isOnline = offlineManager.isDeviceOnline();

      if (isOnline) {
        try {
          return await transactionService.calculateFees(amount, currency, deliveryMethod);
        } catch (error) {
          console.log('Online fee calculation failed, using offline calculation:', error);
          return this.calculateOfflineFees(amount, currency, deliveryMethod);
        }
      } else {
        return this.calculateOfflineFees(amount, currency, deliveryMethod);
      }
    } catch (error) {
      console.error('Failed to calculate fees:', error);
      
      // Return basic offline calculation as fallback
      return this.calculateOfflineFees(amount, currency, deliveryMethod);
    }
  }

  // Calculate fees offline
  private calculateOfflineFees(amount: number, currency: string, deliveryMethod: string): any {
    // Basic fee calculation logic for offline mode
    const baseFee = currency === 'USD' ? 3 : currency === 'ZAR' ? 30 : 3;
    const deliveryFee = deliveryMethod === 'home_delivery' ? 5 : 0;
    const transferFee = Math.max(baseFee, amount * 0.03); // 3% or minimum fee

    return {
      amount,
      currency,
      transferFee,
      exchangeRate: 1,
      totalAmount: amount + transferFee + deliveryFee,
      deliveryFee,
      estimatedDeliveryTime: '2-3 business days',
    };
  }

  // Cancel transaction with offline support
  async cancelTransaction(transactionId: string): Promise<any> {
    try {
      // Check if it's an offline transaction
      if (transactionId.startsWith('offline_')) {
        const offlineTransactions = await offlineManager.getOfflineTransactions();
        const offlineTransaction = offlineTransactions.find(t => t.id === transactionId);
        
        if (!offlineTransaction) {
          throw AppError.fromBusinessError(
            ErrorCode.NOT_FOUND,
            'Offline transaction not found',
            'Transaction may have been synced or deleted'
          );
        }

        if (offlineTransaction.status === 'completed') {
          throw AppError.fromBusinessError(
            ErrorCode.VALIDATION_ERROR,
            'Cannot cancel completed transaction',
            'Transaction has already been processed'
          );
        }

        // Mark as cancelled in offline storage
        await offlineManager.updateTransactionStatus(transactionId, 'failed', 'Cancelled by user');

        return {
          id: transactionId,
          status: 'cancelled',
          updatedAt: new Date().toISOString(),
        };
      }

      // Try to cancel online transaction
      const isOnline = offlineManager.isDeviceOnline();
      
      if (isOnline) {
        try {
          return await transactionService.cancelTransaction(transactionId);
        } catch (error) {
          console.log('Failed to cancel online transaction:', error);
          throw error;
        }
      } else {
        throw AppError.fromBusinessError(
          ErrorCode.NETWORK_ERROR,
          'Cannot cancel transaction while offline',
          'Please check your internet connection and try again'
        );
      }
    } catch (error) {
      console.error('Failed to cancel transaction:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw AppError.fromBusinessError(
        ErrorCode.TRANSACTION_FAILED,
        'Failed to cancel transaction',
        'Please try again later'
      );
    }
  }

  // Retry failed offline transaction
  async retryOfflineTransaction(transactionId: string): Promise<OfflineTransactionResult> {
    try {
      const offlineTransactions = await offlineManager.getOfflineTransactions();
      const offlineTransaction = offlineTransactions.find(t => t.id === transactionId);
      
      if (!offlineTransaction) {
        throw AppError.fromBusinessError(
          ErrorCode.NOT_FOUND,
          'Offline transaction not found',
          'Transaction may have been deleted'
        );
      }

      if (offlineTransaction.status !== 'failed') {
        throw AppError.fromBusinessError(
          ErrorCode.VALIDATION_ERROR,
          'Cannot retry non-failed transaction',
          'Only failed transactions can be retried'
        );
      }

      // Reset transaction status to pending
      await offlineManager.updateTransactionStatus(transactionId, 'pending');

      // Trigger sync if online
      const isOnline = offlineManager.isDeviceOnline();
      if (isOnline) {
        offlineManager.scheduleSync();
      }

      return {
        success: true,
        transactionId,
        isOffline: true,
        message: 'Transaction queued for retry',
      };
    } catch (error) {
      console.error('Failed to retry offline transaction:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw AppError.fromBusinessError(
        ErrorCode.TRANSACTION_FAILED,
        'Failed to retry transaction',
        'Please try again later'
      );
    }
  }

  // Get offline transaction status
  async getOfflineTransactionStatus(transactionId: string): Promise<{
    status: string;
    isOffline: boolean;
    retryCount: number;
    errorMessage?: string;
  }> {
    try {
      const offlineTransactions = await offlineManager.getOfflineTransactions();
      const offlineTransaction = offlineTransactions.find(t => t.id === transactionId);
      
      if (offlineTransaction) {
        return {
          status: offlineTransaction.status,
          isOffline: true,
          retryCount: offlineTransaction.retryCount,
          errorMessage: offlineTransaction.errorMessage,
        };
      }

      // Check if it's an online transaction
      const isOnline = offlineManager.isDeviceOnline();
      
      if (isOnline) {
        try {
          const transaction = await transactionService.getTransaction(transactionId);
          return {
            status: transaction.status,
            isOffline: false,
            retryCount: 0,
          };
        } catch (error) {
          console.log('Failed to fetch online transaction status:', error);
          throw error;
        }
      } else {
        throw AppError.fromBusinessError(
          ErrorCode.NETWORK_ERROR,
          'Cannot fetch transaction status while offline',
          'Please check your internet connection and try again'
        );
      }
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw AppError.fromBusinessError(
        ErrorCode.TRANSACTION_FAILED,
        'Failed to get transaction status',
        'Please try again later'
      );
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    isOnline: boolean;
    pendingTransactions: number;
    lastSyncTime: string;
    syncInProgress: boolean;
  }> {
    try {
      const status = await offlineManager.getSyncStatus();
      
      return {
        isOnline: status.isOnline,
        pendingTransactions: status.pendingTransactions,
        lastSyncTime: status.lastSyncTime,
        syncInProgress: status.syncInProgress,
      };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      
      return {
        isOnline: false,
        pendingTransactions: 0,
        lastSyncTime: new Date().toISOString(),
        syncInProgress: false,
      };
    }
  }

  // Manual sync
  async syncOfflineData(): Promise<{
    success: boolean;
    syncedTransactions: number;
    failedTransactions: number;
    errors: string[];
  }> {
    try {
      return await offlineManager.syncOfflineData();
    } catch (error) {
      console.error('Failed to sync offline data:', error);
      
      return {
        success: false,
        syncedTransactions: 0,
        failedTransactions: 0,
        errors: ['Sync operation failed'],
      };
    }
  }
}

// Export singleton instance
export const offlineTransactionService = OfflineTransactionService.getInstance(); 