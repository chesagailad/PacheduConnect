import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../services/apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  kycLevel: 'bronze' | 'silver' | 'gold';
  kycStatus: 'pending' | 'approved' | 'rejected';
  balance: {
    ZAR: number;
    USD: number;
    ZWL: number;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string, newPassword: string) => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('auth_token');
      if (storedToken) {
        setToken(storedToken);
        await fetchUserProfile();
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await apiClient.get('/users/profile');
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      await logout();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      const { token: newToken, user: userData } = response.data;
      
      await SecureStore.setItemAsync('auth_token', newToken);
      setToken(newToken);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post('/auth/register', userData);

      const { token: newToken, user: newUserData } = response.data;
      
      await SecureStore.setItemAsync('auth_token', newToken);
      setToken(newToken);
      setUser(newUserData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await AsyncStorage.removeItem('user_data');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await apiClient.post('/auth/refresh');
      const { token: newToken } = response.data;
      
      await SecureStore.setItemAsync('auth_token', newToken);
      setToken(newToken);
    } catch (error) {
      console.error('Failed to refresh token:', error);
      await logout();
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await apiClient.put('/users/profile', userData);
      setUser(response.data.user);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const sendOTP = async (email: string) => {
    try {
      await apiClient.post('/auth/send-otp', { email });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send OTP');
    }
  };

  const verifyOTP = async (email: string, otp: string, newPassword: string) => {
    try {
      const response = await apiClient.post('/auth/verify-otp', {
        email,
        otp,
        newPassword,
      });

      const { token: newToken, user: userData } = response.data;
      
      await SecureStore.setItemAsync('auth_token', newToken);
      setToken(newToken);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to verify OTP');
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    sendOTP,
    verifyOTP,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 