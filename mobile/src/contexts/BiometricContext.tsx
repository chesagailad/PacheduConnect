import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

interface BiometricContextType {
  isBiometricAvailable: boolean;
  isBiometricEnabled: boolean;
  checkBiometricAvailability: () => Promise<boolean>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  authenticateWithBiometric: () => Promise<boolean>;
}

const BiometricContext = createContext<BiometricContextType | undefined>(undefined);

export const useBiometric = () => {
  const context = useContext(BiometricContext);
  if (!context) {
    throw new Error('useBiometric must be used within a BiometricProvider');
  }
  return context;
};

interface BiometricProviderProps {
  children: ReactNode;
}

export const BiometricProvider: React.FC<BiometricProviderProps> = ({ children }) => {
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  const checkBiometricAvailability = async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      const isAvailable = hasHardware && isEnrolled && supportedTypes.length > 0;
      setIsBiometricAvailable(isAvailable);
      
      // Check if biometric is enabled in settings
      const biometricEnabled = await SecureStore.getItemAsync('biometric_enabled');
      setIsBiometricEnabled(biometricEnabled === 'true');
      
      return isAvailable;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  };

  const enableBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric authentication',
        fallbackLabel: 'Use passcode',
      });
      
      if (result.success) {
        await SecureStore.setItemAsync('biometric_enabled', 'true');
        setIsBiometricEnabled(true);
      }
    } catch (error) {
      console.error('Error enabling biometric:', error);
      throw error;
    }
  };

  const disableBiometric = async () => {
    try {
      await SecureStore.deleteItemAsync('biometric_enabled');
      setIsBiometricEnabled(false);
    } catch (error) {
      console.error('Error disabling biometric:', error);
      throw error;
    }
  };

  const authenticateWithBiometric = async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
      });
      
      return result.success;
    } catch (error) {
      console.error('Error authenticating with biometric:', error);
      return false;
    }
  };

  const value: BiometricContextType = {
    isBiometricAvailable,
    isBiometricEnabled,
    checkBiometricAvailability,
    enableBiometric,
    disableBiometric,
    authenticateWithBiometric,
  };

  return (
    <BiometricContext.Provider value={value}>
      {children}
    </BiometricContext.Provider>
  );
}; 