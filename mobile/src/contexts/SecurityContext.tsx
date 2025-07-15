import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

interface SecurityContextType {
  isAppLocked: boolean;
  enableAppLock: (pin: string) => Promise<void>;
  disableAppLock: () => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  changePin: (oldPin: string, newPin: string) => Promise<void>;
  isPinSet: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [isPinSet, setIsPinSet] = useState(false);

  const hashPin = async (pin: string): Promise<string> => {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      pin
    );
  };

  const enableAppLock = async (pin: string) => {
    try {
      const hashedPin = await hashPin(pin);
      await SecureStore.setItemAsync('app_pin', hashedPin);
      setIsAppLocked(true);
      setIsPinSet(true);
    } catch (error) {
      console.error('Error enabling app lock:', error);
      throw error;
    }
  };

  const disableAppLock = async () => {
    try {
      await SecureStore.deleteItemAsync('app_pin');
      setIsAppLocked(false);
      setIsPinSet(false);
    } catch (error) {
      console.error('Error disabling app lock:', error);
      throw error;
    }
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    try {
      const storedPin = await SecureStore.getItemAsync('app_pin');
      if (!storedPin) return false;

      const hashedPin = await hashPin(pin);
      return hashedPin === storedPin;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  };

  const changePin = async (oldPin: string, newPin: string) => {
    try {
      const isOldPinCorrect = await verifyPin(oldPin);
      if (!isOldPinCorrect) {
        throw new Error('Incorrect old PIN');
      }

      const hashedNewPin = await hashPin(newPin);
      await SecureStore.setItemAsync('app_pin', hashedNewPin);
    } catch (error) {
      console.error('Error changing PIN:', error);
      throw error;
    }
  };

  const value: SecurityContextType = {
    isAppLocked,
    enableAppLock,
    disableAppLock,
    verifyPin,
    changePin,
    isPinSet,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}; 