import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';

interface NetworkContextType {
  isConnected: boolean;
  connectionType: string | null;
  isInternetReachable: boolean | null;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
      setConnectionType(state.type);
      setIsInternetReachable(state.isInternetReachable);
    });

    return () => unsubscribe();
  }, []);

  const value: NetworkContextType = {
    isConnected,
    connectionType,
    isInternetReachable,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}; 