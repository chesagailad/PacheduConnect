import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetwork } from './NetworkContext';

interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
}

interface OfflineContextType {
  pendingActions: OfflineAction[];
  addOfflineAction: (action: Omit<OfflineAction, 'id' | 'timestamp'>) => Promise<void>;
  removeOfflineAction: (id: string) => Promise<void>;
  syncOfflineActions: () => Promise<void>;
  clearOfflineActions: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const { isConnected } = useNetwork();

  useEffect(() => {
    loadOfflineActions();
  }, []);

  useEffect(() => {
    if (isConnected && pendingActions.length > 0) {
      syncOfflineActions();
    }
  }, [isConnected, pendingActions.length]);

  const loadOfflineActions = async () => {
    try {
      const stored = await AsyncStorage.getItem('offline_actions');
      if (stored) {
        setPendingActions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading offline actions:', error);
    }
  };

  const saveOfflineActions = async (actions: OfflineAction[]) => {
    try {
      await AsyncStorage.setItem('offline_actions', JSON.stringify(actions));
    } catch (error) {
      console.error('Error saving offline actions:', error);
    }
  };

  const addOfflineAction = async (action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
    const newAction: OfflineAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    const updatedActions = [...pendingActions, newAction];
    setPendingActions(updatedActions);
    await saveOfflineActions(updatedActions);
  };

  const removeOfflineAction = async (id: string) => {
    const updatedActions = pendingActions.filter(action => action.id !== id);
    setPendingActions(updatedActions);
    await saveOfflineActions(updatedActions);
  };

  const syncOfflineActions = async () => {
    if (!isConnected || pendingActions.length === 0) return;

    const actionsToSync = [...pendingActions];
    
    for (const action of actionsToSync) {
      try {
        // Attempt to sync the action with the server
        // This would typically involve making API calls based on the action type
        console.log('Syncing offline action:', action);
        
        // Remove the action from pending list after successful sync
        await removeOfflineAction(action.id);
      } catch (error) {
        console.error('Error syncing offline action:', error);
        // Keep the action in the pending list if sync fails
      }
    }
  };

  const clearOfflineActions = async () => {
    setPendingActions([]);
    await AsyncStorage.removeItem('offline_actions');
  };

  const value: OfflineContextType = {
    pendingActions,
    addOfflineAction,
    removeOfflineAction,
    syncOfflineActions,
    clearOfflineActions,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}; 