import { useState, useEffect, useCallback } from 'react';
import { offlineManager, OfflineTransaction, SyncResult } from '../services/offline/offlineManager';
import { AppError, ErrorCode } from '../utils/errors';

export interface OfflineStatus {
  isOnline: boolean;
  syncInProgress: boolean;
  lastSyncTime: string;
  pendingTransactions: number;
  totalTransactions: number;
}

export interface UseOfflineReturn {
  // Network status
  isOnline: boolean;
  
  // Sync status
  syncStatus: OfflineStatus;
  
  // Offline transactions
  offlineTransactions: OfflineTransaction[];
  pendingTransactions: OfflineTransaction[];
  
  // Actions
  storeOfflineTransaction: (transaction: Omit<OfflineTransaction, 'id' | 'status' | 'createdAt' | 'retryCount'>) => Promise<string>;
  syncOfflineData: () => Promise<SyncResult>;
  getSyncStatus: () => Promise<OfflineStatus>;
  clearOfflineData: () => Promise<void>;
  
  // Loading states
  isLoading: boolean;
  isSyncing: boolean;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useOffline = (): UseOfflineReturn => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<OfflineStatus>({
    isOnline: true,
    syncInProgress: false,
    lastSyncTime: new Date().toISOString(),
    pendingTransactions: 0,
    totalTransactions: 0,
  });
  const [offlineTransactions, setOfflineTransactions] = useState<OfflineTransaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<OfflineTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize offline manager and load data
  useEffect(() => {
    const initializeOffline = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize offline manager
        await offlineManager.initialize();

        // Load initial data
        await loadOfflineData();

        // Set up network listener
        const unsubscribe = offlineManager.addNetworkListener((online) => {
          setIsOnline(online);
          setSyncStatus(prev => ({ ...prev, isOnline: online }));
        });

        return unsubscribe;
      } catch (error) {
        console.error('Failed to initialize offline functionality:', error);
        setError('Failed to initialize offline functionality');
      } finally {
        setIsLoading(false);
      }
    };

    initializeOffline();
  }, []);

  // Load offline data
  const loadOfflineData = useCallback(async () => {
    try {
      const [transactions, pending, status] = await Promise.all([
        offlineManager.getOfflineTransactions(),
        offlineManager.getPendingTransactions(),
        offlineManager.getSyncStatus(),
      ]);

      setOfflineTransactions(transactions);
      setPendingTransactions(pending);
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to load offline data:', error);
      setError('Failed to load offline data');
    }
  }, []);

  // Store offline transaction
  const storeOfflineTransaction = useCallback(async (
    transaction: Omit<OfflineTransaction, 'id' | 'status' | 'createdAt' | 'retryCount'>
  ): Promise<string> => {
    try {
      setError(null);
      const transactionId = await offlineManager.storeOfflineTransaction(transaction);
      
      // Reload data to reflect changes
      await loadOfflineData();
      
      return transactionId;
    } catch (error) {
      console.error('Failed to store offline transaction:', error);
      
      if (error instanceof AppError) {
        setError(error.userMessage);
      } else {
        setError('Failed to store offline transaction');
      }
      
      throw error;
    }
  }, [loadOfflineData]);

  // Sync offline data
  const syncOfflineData = useCallback(async (): Promise<SyncResult> => {
    try {
      setIsSyncing(true);
      setError(null);

      const result = await offlineManager.syncOfflineData();
      
      // Reload data after sync
      await loadOfflineData();
      
      return result;
    } catch (error) {
      console.error('Failed to sync offline data:', error);
      
      if (error instanceof AppError) {
        setError(error.userMessage);
      } else {
        setError('Failed to sync offline data');
      }
      
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [loadOfflineData]);

  // Get sync status
  const getSyncStatus = useCallback(async (): Promise<OfflineStatus> => {
    try {
      const status = await offlineManager.getSyncStatus();
      setSyncStatus(status);
      return status;
    } catch (error) {
      console.error('Failed to get sync status:', error);
      setError('Failed to get sync status');
      throw error;
    }
  }, []);

  // Clear offline data
  const clearOfflineData = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await offlineManager.clearOfflineData();
      
      // Reset state
      setOfflineTransactions([]);
      setPendingTransactions([]);
      setSyncStatus({
        isOnline,
        syncInProgress: false,
        lastSyncTime: new Date().toISOString(),
        pendingTransactions: 0,
        totalTransactions: 0,
      });
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      setError('Failed to clear offline data');
      throw error;
    }
  }, [isOnline]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingTransactions.length > 0 && !isSyncing) {
      // Delay sync to avoid immediate sync on network change
      const timeoutId = setTimeout(() => {
        syncOfflineData().catch(error => {
          console.error('Auto-sync failed:', error);
        });
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [isOnline, pendingTransactions.length, isSyncing, syncOfflineData]);

  // Periodic status updates
  useEffect(() => {
    const intervalId = setInterval(() => {
      getSyncStatus().catch(error => {
        console.error('Failed to update sync status:', error);
      });
    }, 10000); // Update every 10 seconds

    return () => clearInterval(intervalId);
  }, [getSyncStatus]);

  return {
    // Network status
    isOnline,
    
    // Sync status
    syncStatus,
    
    // Offline transactions
    offlineTransactions,
    pendingTransactions,
    
    // Actions
    storeOfflineTransaction,
    syncOfflineData,
    getSyncStatus,
    clearOfflineData,
    
    // Loading states
    isLoading,
    isSyncing,
    
    // Error handling
    error,
    clearError,
  };
}; 