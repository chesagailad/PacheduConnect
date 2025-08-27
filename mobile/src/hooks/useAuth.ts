import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';
import { authService, LoginRequest, RegisterRequest } from '../services/api/authService';
import { AppError, ErrorCode, createUserFriendlyMessage } from '../utils/errors';

interface User {
  id: string;
  email: string;
  name: string;
  kycStatus: 'pending' | 'approved' | 'rejected';
  balance: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check if user is authenticated using the enhanced authService
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        // Validate session with server
        const isValidSession = await authService.validateSession();
        
        if (isValidSession) {
          const user = await authService.getUserData();
          const token = await authService.getAuthToken();
          
          if (user && token) {
            setAuthState({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }
        }
      }
      
      // If not authenticated or session invalid, clear state
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const request: LoginRequest = { email, password };
      const response = await authService.login(request);
      
      setAuthState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      if (error instanceof AppError) {
        return { 
          success: false, 
          error: createUserFriendlyMessage(error),
          code: error.code 
        };
      }
      
      return { 
        success: false, 
        error: 'Login failed. Please try again.',
        code: ErrorCode.UNKNOWN_ERROR 
      };
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const request: RegisterRequest = userData;
      const response = await authService.register(request);
      
      setAuthState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      if (error instanceof AppError) {
        return { 
          success: false, 
          error: createUserFriendlyMessage(error),
          code: error.code 
        };
      }
      
      return { 
        success: false, 
        error: 'Registration failed. Please try again.',
        code: ErrorCode.UNKNOWN_ERROR 
      };
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      await authService.logout();
      
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Biometric check error:', error);
      return false;
    }
  };

  const authenticateWithBiometrics = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with biometrics',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      
      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      if (authState.user) {
        const updatedUser = { ...authState.user, ...updates };
        setAuthState(prev => ({ ...prev, user: updatedUser }));
        
        // Update user data on server
        await authService.updateProfile({
          name: updates.name,
          email: updates.email,
        });
      }
    } catch (error) {
      console.error('Update user error:', error);
      if (error instanceof AppError) {
        Alert.alert('Error', createUserFriendlyMessage(error));
      }
    }
  };

  const refreshUserData = async () => {
    try {
      const user = await authService.getProfile();
      setAuthState(prev => ({ ...prev, user }));
    } catch (error) {
      console.error('Refresh user data error:', error);
      if (error instanceof AppError && error.code === ErrorCode.TOKEN_EXPIRED) {
        // Token expired, logout user
        await logout();
      }
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await authService.forgotPassword({ email });
      return { success: true };
    } catch (error) {
      if (error instanceof AppError) {
        return { 
          success: false, 
          error: createUserFriendlyMessage(error),
          code: error.code 
        };
      }
      
      return { 
        success: false, 
        error: 'Password reset failed. Please try again.',
        code: ErrorCode.UNKNOWN_ERROR 
      };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await authService.changePassword({ currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      if (error instanceof AppError) {
        return { 
          success: false, 
          error: createUserFriendlyMessage(error),
          code: error.code 
        };
      }
      
      return { 
        success: false, 
        error: 'Password change failed. Please try again.',
        code: ErrorCode.UNKNOWN_ERROR 
      };
    }
  };

  return {
    ...authState,
    login,
    register,
    logout,
    checkBiometricAvailability,
    authenticateWithBiometrics,
    updateUser,
    refreshUserData,
    forgotPassword,
    changePassword,
  };
}; 