import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import { AppError, ErrorCode } from '../../utils/errors';

// Offline Manager Interfaces
export interface OfflineTransaction {
  id: string;
  type: 'send' | 'receive' | 'withdrawal' | 'deposit';
  amount: number;
  currency: string;
  recipientId?: string;
  recipientName?: string;
  recipientEmail?: string;
  description?: string;
  deliveryMethod: 'bank_transfer' | 'ecocash' | 'cash_pickup' | 'home_delivery';
  deliveryDetails: Record<string, any>;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  createdAt: string;
  syncedAt?: string;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
}

export interface OfflineData {
  transactions: OfflineTransaction[];
  userData: any;
  kycData: any;
  settings: any;
  lastSyncTime: string;
  syncVersion: number;
}

export interface SyncResult {
  success: boolean;
  syncedTransactions: number;
  failedTransactions: number;
  errors: string[];
  lastSyncTime: string;
}

export interface OfflineConfig {
  maxRetries: number;
  retryDelay: number;
  syncInterval: number;
  maxOfflineDays: number;
  enableBackgroundSync: boolean;
}

// Offline Manager Class
export class OfflineManager {
  private static instance: OfflineManager;
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private config: OfflineConfig;

  private constructor() {
    this.config = {
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      syncInterval: 30000, // 30 seconds
      maxOfflineDays: 7,
      enableBackgroundSync: true,
    };
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  // Initialize offline manager
  async initialize(): Promise<void> {
    try {
      // Check initial network status
      const netInfo = await NetInfo.fetch();
      this.isOnline = netInfo.isConnected ?? false;

      // Set up network listener
      NetInfo.addEventListener((state) => {
        const wasOnline = this.isOnline;
        this.isOnline = state.isConnected ?? false;

        // Notify listeners of status change
        if (wasOnline !== this.isOnline) {
          this.notifyListeners();
        }

        // Auto-sync when coming back online
        if (this.isOnline && !wasOnline) {
          this.scheduleSync();
        }
      });

      // Start background sync if enabled
      if (this.config.enableBackgroundSync) {
        this.startBackgroundSync();
      }

      console.log('OfflineManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OfflineManager:', error);
      throw AppError.fromServerError(error);
    }
  }

  // Check if device is online
  isDeviceOnline(): boolean {
    return this.isOnline;
  }

  // Add network status listener
  addNetworkListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.isOnline);
      } catch (error) {
        console.error('Error in network listener:', error);
      }
    });
  }

  // Store offline transaction
  async storeOfflineTransaction(transaction: Omit<OfflineTransaction, 'id' | 'status' | 'createdAt' | 'retryCount'>): Promise<string> {
    try {
      const offlineTransaction: OfflineTransaction = {
        ...transaction,
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
        retryCount: 0,
        maxRetries: this.config.maxRetries,
      };

      const offlineData = await this.getOfflineData();
      offlineData.transactions.push(offlineTransaction);
      await this.saveOfflineData(offlineData);

      console.log('Offline transaction stored:', offlineTransaction.id);
      return offlineTransaction.id;
    } catch (error) {
      console.error('Failed to store offline transaction:', error);
      throw AppError.fromBusinessError(
        ErrorCode.STORAGE_ERROR,
        'Failed to store offline transaction',
        'Please try again when online'
      );
    }
  }

  // Get offline transactions
  async getOfflineTransactions(): Promise<OfflineTransaction[]> {
    try {
      const offlineData = await this.getOfflineData();
      return offlineData.transactions;
    } catch (error) {
      console.error('Failed to get offline transactions:', error);
      return [];
    }
  }

  // Get pending offline transactions
  async getPendingTransactions(): Promise<OfflineTransaction[]> {
    try {
      const transactions = await this.getOfflineTransactions();
      return transactions.filter(t => t.status === 'pending' || t.status === 'syncing');
    } catch (error) {
      console.error('Failed to get pending transactions:', error);
      return [];
    }
  }

  // Update offline transaction status
  async updateTransactionStatus(transactionId: string, status: OfflineTransaction['status'], errorMessage?: string): Promise<void> {
    try {
      const offlineData = await this.getOfflineData();
      const transaction = offlineData.transactions.find(t => t.id === transactionId);
      
      if (transaction) {
        transaction.status = status;
        transaction.errorMessage = errorMessage;
        
        if (status === 'syncing') {
          transaction.retryCount++;
        } else if (status === 'completed') {
          transaction.syncedAt = new Date().toISOString();
        }
        
        await this.saveOfflineData(offlineData);
      }
    } catch (error) {
      console.error('Failed to update transaction status:', error);
    }
  }

  // Remove completed/failed transactions
  async cleanupTransactions(): Promise<void> {
    try {
      const offlineData = await this.getOfflineData();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.maxOfflineDays);

      offlineData.transactions = offlineData.transactions.filter(transaction => {
        // Keep pending and syncing transactions
        if (transaction.status === 'pending' || transaction.status === 'syncing') {
          return true;
        }

        // Remove old completed/failed transactions
        const transactionDate = new Date(transaction.createdAt);
        return transactionDate > cutoffDate;
      });

      await this.saveOfflineData(offlineData);
    } catch (error) {
      console.error('Failed to cleanup transactions:', error);
    }
  }

  // Sync offline data with server
  async syncOfflineData(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return {
        success: false,
        syncedTransactions: 0,
        failedTransactions: 0,
        errors: ['Sync already in progress'],
        lastSyncTime: new Date().toISOString(),
      };
    }

    if (!this.isOnline) {
      return {
        success: false,
        syncedTransactions: 0,
        failedTransactions: 0,
        errors: ['Device is offline'],
        lastSyncTime: new Date().toISOString(),
      };
    }

    this.syncInProgress = true;
    const result: SyncResult = {
      success: true,
      syncedTransactions: 0,
      failedTransactions: 0,
      errors: [],
      lastSyncTime: new Date().toISOString(),
    };

    try {
      const pendingTransactions = await this.getPendingTransactions();
      
      for (const transaction of pendingTransactions) {
        try {
          // Update status to syncing
          await this.updateTransactionStatus(transaction.id, 'syncing');

          // Simulate API call (replace with actual API call)
          await this.simulateTransactionSync(transaction);

          // Mark as completed
          await this.updateTransactionStatus(transaction.id, 'completed');
          result.syncedTransactions++;

          // Add delay between transactions
          await this.delay(1000);
        } catch (error) {
          console.error(`Failed to sync transaction ${transaction.id}:`, error);
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Transaction ${transaction.id}: ${errorMessage}`);
          result.failedTransactions++;

          // Update status based on retry count
          if (transaction.retryCount >= transaction.maxRetries) {
            await this.updateTransactionStatus(transaction.id, 'failed', errorMessage);
          } else {
            await this.updateTransactionStatus(transaction.id, 'pending', errorMessage);
          }
        }
      }

      // Update last sync time
      const offlineData = await this.getOfflineData();
      offlineData.lastSyncTime = result.lastSyncTime;
      offlineData.syncVersion++;
      await this.saveOfflineData(offlineData);

      // Cleanup old transactions
      await this.cleanupTransactions();

    } catch (error) {
      console.error('Sync failed:', error);
      result.success = false;
      result.errors.push('Sync operation failed');
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  // Simulate transaction sync (replace with actual API call)
  private async simulateTransactionSync(transaction: OfflineTransaction): Promise<void> {
    // Simulate network delay
    await this.delay(2000);

    // Simulate random failure (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Simulated network error');
    }

    // Simulate successful sync
    console.log(`Transaction ${transaction.id} synced successfully`);
  }

  // Schedule sync operation
  scheduleSync(): void {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    // Add delay before sync to avoid immediate sync on network change
    setTimeout(() => {
      this.syncOfflineData().catch(error => {
        console.error('Scheduled sync failed:', error);
      });
    }, 2000);
  }

  // Start background sync
  startBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncOfflineData().catch(error => {
          console.error('Background sync failed:', error);
        });
      }
    }, this.config.syncInterval);

    console.log('Background sync started');
  }

  // Stop background sync
  stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Background sync stopped');
    }
  }

  // Get offline data
  private async getOfflineData(): Promise<OfflineData> {
    try {
      const data = await SecureStore.getItemAsync('offline_data');
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to get offline data:', error);
    }

    // Return default offline data
    return {
      transactions: [],
      userData: null,
      kycData: null,
      settings: null,
      lastSyncTime: new Date().toISOString(),
      syncVersion: 1,
    };
  }

  // Save offline data
  private async saveOfflineData(data: OfflineData): Promise<void> {
    try {
      await SecureStore.setItemAsync('offline_data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save offline data:', error);
      throw AppError.fromBusinessError(
        ErrorCode.STORAGE_ERROR,
        'Failed to save offline data',
        'Please check your device storage'
      );
    }
  }

  // Store user data for offline access
  async storeUserData(userData: any): Promise<void> {
    try {
      const offlineData = await this.getOfflineData();
      offlineData.userData = userData;
      await this.saveOfflineData(offlineData);
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  }

  // Get stored user data
  async getUserData(): Promise<any> {
    try {
      const offlineData = await this.getOfflineData();
      return offlineData.userData;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  // Store KYC data for offline access
  async storeKYCData(kycData: any): Promise<void> {
    try {
      const offlineData = await this.getOfflineData();
      offlineData.kycData = kycData;
      await this.saveOfflineData(offlineData);
    } catch (error) {
      console.error('Failed to store KYC data:', error);
    }
  }

  // Get stored KYC data
  async getKYCData(): Promise<any> {
    try {
      const offlineData = await this.getOfflineData();
      return offlineData.kycData;
    } catch (error) {
      console.error('Failed to get KYC data:', error);
      return null;
    }
  }

  // Store settings for offline access
  async storeSettings(settings: any): Promise<void> {
    try {
      const offlineData = await this.getOfflineData();
      offlineData.settings = settings;
      await this.saveOfflineData(offlineData);
    } catch (error) {
      console.error('Failed to store settings:', error);
    }
  }

  // Get stored settings
  async getSettings(): Promise<any> {
    try {
      const offlineData = await this.getOfflineData();
      return offlineData.settings;
    } catch (error) {
      console.error('Failed to get settings:', error);
      return null;
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    lastSyncTime: string;
    pendingTransactions: number;
    totalTransactions: number;
    isOnline: boolean;
    syncInProgress: boolean;
  }> {
    try {
      const offlineData = await this.getOfflineData();
      const pendingTransactions = await this.getPendingTransactions();

      return {
        lastSyncTime: offlineData.lastSyncTime,
        pendingTransactions: pendingTransactions.length,
        totalTransactions: offlineData.transactions.length,
        isOnline: this.isOnline,
        syncInProgress: this.syncInProgress,
      };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return {
        lastSyncTime: new Date().toISOString(),
        pendingTransactions: 0,
        totalTransactions: 0,
        isOnline: this.isOnline,
        syncInProgress: this.syncInProgress,
      };
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<OfflineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart background sync if interval changed
    if (newConfig.syncInterval && this.syncInterval) {
      this.startBackgroundSync();
    }
  }

  // Get current configuration
  getConfig(): OfflineConfig {
    return { ...this.config };
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('offline_data');
      console.log('Offline data cleared');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }

  // Utility function for delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Destroy instance and cleanup
  destroy(): void {
    this.stopBackgroundSync();
    this.listeners.clear();
    OfflineManager.instance = null as any;
  }
}

// Export singleton instance
export const offlineManager = OfflineManager.getInstance(); 