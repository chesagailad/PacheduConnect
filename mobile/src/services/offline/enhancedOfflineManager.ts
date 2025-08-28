/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Enhanced Offline Manager with comprehensive transaction queuing and sync
 */

import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import { AppError, ErrorCode } from '../../utils/errors';
import { EventEmitter } from 'events';

// Enhanced Offline Manager Interfaces
export interface EnhancedOfflineTransaction {
  id: string;
  type: 'send' | 'receive' | 'withdrawal' | 'deposit' | 'kyc_upload' | 'profile_update';
  amount?: number;
  currency?: string;
  recipientId?: string;
  recipientName?: string;
  recipientEmail?: string;
  description?: string;
  deliveryMethod?: 'bank_transfer' | 'ecocash' | 'cash_pickup' | 'home_delivery';
  deliveryDetails?: Record<string, any>;
  status: 'pending' | 'syncing' | 'completed' | 'failed' | 'retrying';
  createdAt: string;
  syncedAt?: string;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  priority: 'high' | 'medium' | 'low';
  data: Record<string, any>;
  metadata: {
    appVersion: string;
    deviceInfo: string;
    networkType?: string;
    batteryLevel?: number;
  };
}

export interface EnhancedOfflineData {
  transactions: EnhancedOfflineTransaction[];
  userData: any;
  kycData: any;
  settings: any;
  lastSyncTime: string;
  syncVersion: number;
  syncStatus: 'idle' | 'syncing' | 'completed' | 'failed';
  pendingCount: number;
  failedCount: number;
}

export interface EnhancedSyncResult {
  success: boolean;
  syncedTransactions: number;
  failedTransactions: number;
  errors: string[];
  lastSyncTime: string;
  syncDuration: number;
  networkType: string;
  batteryLevel?: number;
}

export interface EnhancedOfflineConfig {
  maxRetries: number;
  retryDelay: number;
  syncInterval: number;
  maxOfflineDays: number;
  enableBackgroundSync: boolean;
  enableSmartSync: boolean;
  enableBatteryOptimization: boolean;
  enableNetworkOptimization: boolean;
  maxQueueSize: number;
  priorityQueueEnabled: boolean;
}

export interface SyncProgress {
  current: number;
  total: number;
  percentage: number;
  currentTransaction?: EnhancedOfflineTransaction;
  status: 'preparing' | 'syncing' | 'validating' | 'completing';
}

// Enhanced Offline Manager Class
export class EnhancedOfflineManager extends EventEmitter {
  private static instance: EnhancedOfflineManager;
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private config: EnhancedOfflineConfig;
  private transactionQueue: EnhancedOfflineTransaction[] = [];
  private syncProgress: SyncProgress | null = null;
  private lastNetworkType: string = 'unknown';
  private batteryLevel: number = 100;

  private constructor() {
    super();
    this.config = {
      maxRetries: 5,
      retryDelay: 3000, // 3 seconds
      syncInterval: 15000, // 15 seconds
      maxOfflineDays: 14,
      enableBackgroundSync: true,
      enableSmartSync: true,
      enableBatteryOptimization: true,
      enableNetworkOptimization: true,
      maxQueueSize: 1000,
      priorityQueueEnabled: true,
    };
  }

  static getInstance(): EnhancedOfflineManager {
    if (!EnhancedOfflineManager.instance) {
      EnhancedOfflineManager.instance = new EnhancedOfflineManager();
    }
    return EnhancedOfflineManager.instance;
  }

  // Initialize enhanced offline manager
  async initialize(): Promise<void> {
    try {
      // Check initial network status
      const netInfo = await NetInfo.fetch();
      this.isOnline = netInfo.isConnected ?? false;
      this.lastNetworkType = netInfo.type || 'unknown';

      // Set up network listener with enhanced monitoring
      NetInfo.addEventListener((state) => {
        const wasOnline = this.isOnline;
        this.isOnline = state.isConnected ?? false;
        this.lastNetworkType = state.type || 'unknown';

        // Notify listeners of status change
        if (wasOnline !== this.isOnline) {
          this.emit('networkStatusChanged', {
            isOnline: this.isOnline,
            networkType: this.lastNetworkType,
            timestamp: new Date().toISOString()
          });
        }

        // Smart sync when coming back online
        if (this.isOnline && !wasOnline) {
          this.scheduleSmartSync();
        }
      });

      // Load existing offline data
      await this.loadOfflineData();

      // Start background sync if enabled
      if (this.config.enableBackgroundSync) {
        this.startBackgroundSync();
      }

      // Set up battery monitoring if enabled
      if (this.config.enableBatteryOptimization) {
        this.setupBatteryMonitoring();
      }

      console.log('Enhanced Offline Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Enhanced Offline Manager:', error);
      throw new AppError({
        code: ErrorCode.STORAGE_ERROR,
        message: 'Failed to initialize offline manager',
        retryable: true,
        userMessage: 'Unable to set up offline functionality',
        timestamp: new Date(),
        context: { originalError: error }
      });
    }
  }

  // Add transaction to offline queue
  async addTransaction(transaction: Omit<EnhancedOfflineTransaction, 'id' | 'status' | 'createdAt' | 'retryCount'>): Promise<string> {
    try {
      const id = this.generateTransactionId();
      const enhancedTransaction: EnhancedOfflineTransaction = {
        ...transaction,
        id,
        status: 'pending',
        createdAt: new Date().toISOString(),
        retryCount: 0,
        metadata: {
          appVersion: '1.0.0', // Get from app config
          deviceInfo: 'React Native', // Get device info
          networkType: this.lastNetworkType,
          batteryLevel: this.batteryLevel,
        }
      };

      // Add to queue with priority
      if (this.config.priorityQueueEnabled) {
        this.addToPriorityQueue(enhancedTransaction);
      } else {
        this.transactionQueue.push(enhancedTransaction);
      }

      // Limit queue size
      if (this.transactionQueue.length > this.config.maxQueueSize) {
        this.transactionQueue = this.transactionQueue.slice(-this.config.maxQueueSize);
      }

      // Save to storage
      await this.saveOfflineData();

      // Emit event
      this.emit('transactionAdded', enhancedTransaction);

      // Auto-sync if online
      if (this.isOnline && !this.syncInProgress) {
        this.scheduleSync();
      }

      return id;
    } catch (error) {
      console.error('Failed to add transaction to offline queue:', error);
      throw new AppError({
        code: ErrorCode.STORAGE_ERROR,
        message: 'Failed to queue offline transaction',
        retryable: true,
        userMessage: 'Unable to save transaction for later sync',
        timestamp: new Date(),
        context: { originalError: error, transaction }
      });
    }
  }

  // Smart sync with network and battery optimization
  async performSmartSync(): Promise<EnhancedSyncResult> {
    if (this.syncInProgress) {
      throw new AppError({
        code: ErrorCode.PERFORMANCE_ERROR,
        message: 'Sync already in progress',
        retryable: false,
        userMessage: 'Sync is already running',
        timestamp: new Date()
      });
    }

    // Check if sync should be performed based on conditions
    if (!this.shouldPerformSync()) {
      return {
        success: false,
        syncedTransactions: 0,
        failedTransactions: 0,
        errors: ['Sync conditions not met'],
        lastSyncTime: new Date().toISOString(),
        syncDuration: 0,
        networkType: this.lastNetworkType,
        batteryLevel: this.batteryLevel
      };
    }

    this.syncInProgress = true;
    const startTime = Date.now();

    try {
      this.emit('syncStarted', { timestamp: new Date().toISOString() });

      const pendingTransactions = this.transactionQueue.filter(t => t.status === 'pending');
      let syncedCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      this.syncProgress = {
        current: 0,
        total: pendingTransactions.length,
        percentage: 0,
        status: 'preparing'
      };

      for (let i = 0; i < pendingTransactions.length; i++) {
        const transaction = pendingTransactions[i];
        
        this.syncProgress = {
          current: i + 1,
          total: pendingTransactions.length,
          percentage: Math.round(((i + 1) / pendingTransactions.length) * 100),
          currentTransaction: transaction,
          status: 'syncing'
        };

        this.emit('syncProgress', this.syncProgress);

        try {
          // Simulate API call
          await this.syncTransaction(transaction);
          transaction.status = 'completed';
          transaction.syncedAt = new Date().toISOString();
          syncedCount++;

          // Add delay between syncs to prevent overwhelming the server
          await this.delay(100);
        } catch (error) {
          transaction.status = 'failed';
          transaction.errorMessage = error instanceof Error ? error.message : 'Unknown error';
          transaction.retryCount++;

          if (transaction.retryCount >= this.config.maxRetries) {
            failedCount++;
            errors.push(`Transaction ${transaction.id} failed after ${transaction.retryCount} retries`);
          } else {
            // Mark for retry
            transaction.status = 'retrying';
          }
        }
      }

      // Update sync status
      await this.saveOfflineData();

      const syncDuration = Date.now() - startTime;
      const result: EnhancedSyncResult = {
        success: failedCount === 0,
        syncedTransactions: syncedCount,
        failedTransactions: failedCount,
        errors,
        lastSyncTime: new Date().toISOString(),
        syncDuration,
        networkType: this.lastNetworkType,
        batteryLevel: this.batteryLevel
      };

      this.emit('syncCompleted', result);
      return result;

    } catch (error) {
      const syncDuration = Date.now() - startTime;
      const result: EnhancedSyncResult = {
        success: false,
        syncedTransactions: 0,
        failedTransactions: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSyncTime: new Date().toISOString(),
        syncDuration,
        networkType: this.lastNetworkType,
        batteryLevel: this.batteryLevel
      };

      this.emit('syncFailed', result);
      throw error;
    } finally {
      this.syncInProgress = false;
      this.syncProgress = null;
    }
  }

  // Get sync progress
  getSyncProgress(): SyncProgress | null {
    return this.syncProgress;
  }

  // Get offline statistics
  getOfflineStats(): {
    totalTransactions: number;
    pendingTransactions: number;
    completedTransactions: number;
    failedTransactions: number;
    retryingTransactions: number;
    lastSyncTime: string;
    isOnline: boolean;
    networkType: string;
    batteryLevel: number;
  } {
    const stats = {
      totalTransactions: this.transactionQueue.length,
      pendingTransactions: this.transactionQueue.filter(t => t.status === 'pending').length,
      completedTransactions: this.transactionQueue.filter(t => t.status === 'completed').length,
      failedTransactions: this.transactionQueue.filter(t => t.status === 'failed').length,
      retryingTransactions: this.transactionQueue.filter(t => t.status === 'retrying').length,
      lastSyncTime: new Date().toISOString(),
      isOnline: this.isOnline,
      networkType: this.lastNetworkType,
      batteryLevel: this.batteryLevel
    };

    return stats;
  }

  // Retry failed transactions
  async retryFailedTransactions(): Promise<EnhancedSyncResult> {
    const failedTransactions = this.transactionQueue.filter(t => t.status === 'failed');
    
    for (const transaction of failedTransactions) {
      transaction.status = 'retrying';
      transaction.retryCount = 0;
    }

    await this.saveOfflineData();
    return this.performSmartSync();
  }

  // Clear completed transactions
  async clearCompletedTransactions(): Promise<void> {
    this.transactionQueue = this.transactionQueue.filter(t => t.status !== 'completed');
    await this.saveOfflineData();
    this.emit('transactionsCleared', { timestamp: new Date().toISOString() });
  }

  // Private helper methods
  private generateTransactionId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToPriorityQueue(transaction: EnhancedOfflineTransaction): void {
    const insertIndex = this.transactionQueue.findIndex(t => t.priority === 'low');
    if (insertIndex === -1) {
      this.transactionQueue.push(transaction);
    } else {
      this.transactionQueue.splice(insertIndex, 0, transaction);
    }
  }

  private shouldPerformSync(): boolean {
    // Check battery level
    if (this.config.enableBatteryOptimization && this.batteryLevel < 20) {
      return false;
    }

    // Check network type
    if (this.config.enableNetworkOptimization && this.lastNetworkType === 'cellular') {
      // Only sync high priority transactions on cellular
      const highPriorityTransactions = this.transactionQueue.filter(t => 
        t.status === 'pending' && t.priority === 'high'
      );
      return highPriorityTransactions.length > 0;
    }

    return true;
  }

  private async syncTransaction(transaction: EnhancedOfflineTransaction): Promise<void> {
    // Simulate API call with timeout
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Sync timeout'));
      }, 10000);

      // Simulate network delay
      setTimeout(() => {
        clearTimeout(timeout);
        
        // Simulate success/failure based on retry count
        if (transaction.retryCount > 2 && Math.random() < 0.3) {
          reject(new Error('Simulated sync failure'));
        } else {
          resolve();
        }
      }, 500 + Math.random() * 1000);
    });
  }

  private async loadOfflineData(): Promise<void> {
    try {
      const data = await SecureStore.getItemAsync('enhanced_offline_data');
      if (data) {
        const parsedData: EnhancedOfflineData = JSON.parse(data);
        this.transactionQueue = parsedData.transactions || [];
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  }

  private async saveOfflineData(): Promise<void> {
    try {
      const data: EnhancedOfflineData = {
        transactions: this.transactionQueue,
        userData: {},
        kycData: {},
        settings: {},
        lastSyncTime: new Date().toISOString(),
        syncVersion: 1,
        syncStatus: this.syncInProgress ? 'syncing' : 'idle',
        pendingCount: this.transactionQueue.filter(t => t.status === 'pending').length,
        failedCount: this.transactionQueue.filter(t => t.status === 'failed').length,
      };

      await SecureStore.setItemAsync('enhanced_offline_data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  private startBackgroundSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress && this.transactionQueue.length > 0) {
        this.performSmartSync().catch(error => {
          console.error('Background sync failed:', error);
        });
      }
    }, this.config.syncInterval);
  }

  private scheduleSmartSync(): void {
    setTimeout(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.performSmartSync().catch(error => {
          console.error('Smart sync failed:', error);
        });
      }
    }, 2000); // Delay to ensure network is stable
  }

  private setupBatteryMonitoring(): void {
    // In a real implementation, you would use a battery monitoring library
    // For now, we'll simulate battery level changes
    setInterval(() => {
      this.batteryLevel = Math.max(0, this.batteryLevel - Math.random() * 2);
      if (this.batteryLevel < 20) {
        this.emit('lowBattery', { batteryLevel: this.batteryLevel });
      }
    }, 60000); // Check every minute
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public getters
  get isOnlineStatus(): boolean {
    return this.isOnline;
  }

  get isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  get queueLength(): number {
    return this.transactionQueue.length;
  }

  get pendingCount(): number {
    return this.transactionQueue.filter(t => t.status === 'pending').length;
  }

  get failedCount(): number {
    return this.transactionQueue.filter(t => t.status === 'failed').length;
  }
}

// Export singleton instance
export const enhancedOfflineManager = EnhancedOfflineManager.getInstance(); 