import { apiClient } from './apiClient';
import * as SecureStore from 'expo-secure-store';
import { AppError, ErrorCode } from '../../utils/errors';

// Authentication Interfaces
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    kycStatus: 'pending' | 'approved' | 'rejected';
    balance: number;
    createdAt: string;
  };
  token: string;
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  email?: string;
}

// Authentication Validation
export class AuthValidator {
  static validateEmail(email: string): void {
    if (!email || email.trim().length === 0) {
      throw AppError.fromValidationError('email', 'Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw AppError.fromValidationError('email', 'Please enter a valid email address');
    }
  }

  static validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw AppError.fromValidationError('password', 'Password must be at least 8 characters long');
    }

    // Check for at least one uppercase letter, one lowercase letter, and one number
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      throw AppError.fromValidationError(
        'password',
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
    }
  }

  static validatePhone(phone: string): void {
    if (!phone || phone.trim().length === 0) {
      throw AppError.fromValidationError('phone', 'Phone number is required');
    }

    // Basic phone validation (can be enhanced based on country)
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      throw AppError.fromValidationError('phone', 'Please enter a valid phone number');
    }
  }

  static validateName(name: string): void {
    if (!name || name.trim().length < 2) {
      throw AppError.fromValidationError('name', 'Name must be at least 2 characters long');
    }
  }
}

// Authentication Service Class
export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Login user
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      AuthValidator.validateEmail(credentials.email);
      
      if (!credentials.password) {
        throw AppError.fromValidationError('password', 'Password is required');
      }

      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      
      // Store tokens securely
      await this.storeTokens(response.data.token, response.data.refreshToken);
      await this.storeUserData(response.data.user);

      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Register new user
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      AuthValidator.validateName(userData.name);
      AuthValidator.validateEmail(userData.email);
      AuthValidator.validatePassword(userData.password);
      AuthValidator.validatePhone(userData.phone);

      const response = await apiClient.post<AuthResponse>('/auth/register', userData);
      
      // Store tokens securely
      await this.storeTokens(response.data.token, response.data.refreshToken);
      await this.storeUserData(response.data.user);

      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Forgot password
  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    try {
      AuthValidator.validateEmail(data.email);

      const response = await apiClient.post<{ message: string }>('/auth/forgot-password', data);
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Reset password
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    try {
      if (!data.token) {
        throw AppError.fromValidationError('token', 'Reset token is required');
      }

      AuthValidator.validatePassword(data.password);

      const response = await apiClient.post<{ message: string }>('/auth/reset-password', data);
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Verify email
  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      if (!token) {
        throw AppError.fromValidationError('token', 'Verification token is required');
      }

      const response = await apiClient.post<{ message: string }>('/auth/verify-email', { token });
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Refresh token
  async refreshToken(): Promise<{ token: string; refreshToken: string }> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        throw AppError.fromAuthError({
          code: ErrorCode.TOKEN_EXPIRED,
          message: 'No refresh token available',
          retryable: false,
          userMessage: 'Please log in again',
          timestamp: new Date(),
        });
      }

      const response = await apiClient.post<{ token: string; refreshToken: string }>('/auth/refresh-token', {
        refreshToken,
      });

      // Update stored tokens
      await this.storeTokens(response.data.token, response.data.refreshToken);

      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Call logout endpoint
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, we should clear local storage
      console.error('Logout error:', error);
    } finally {
      // Clear all stored data
      await this.clearStoredData();
    }
  }

  // Get user profile
  async getProfile(): Promise<AuthResponse['user']> {
    try {
      const response = await apiClient.get<AuthResponse['user']>('/auth/profile');
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Update user profile
  async updateProfile(updates: UpdateProfileRequest): Promise<AuthResponse['user']> {
    try {
      if (updates.email) {
        AuthValidator.validateEmail(updates.email);
      }
      if (updates.phone) {
        AuthValidator.validatePhone(updates.phone);
      }
      if (updates.name) {
        AuthValidator.validateName(updates.name);
      }

      const response = await apiClient.put<AuthResponse['user']>('/auth/profile', updates);
      
      // Update stored user data
      await this.storeUserData(response.data);

      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    try {
      if (!data.currentPassword) {
        throw AppError.fromValidationError('currentPassword', 'Current password is required');
      }

      AuthValidator.validatePassword(data.newPassword);

      const response = await apiClient.post<{ message: string }>('/auth/change-password', data);
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      return !!token;
    } catch (error) {
      return false;
    }
  }

  // Get stored auth token
  async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Get stored refresh token
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('refresh_token');
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  // Get stored user data
  async getUserData(): Promise<AuthResponse['user'] | null> {
    try {
      const userData = await SecureStore.getItemAsync('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Store tokens securely
  private async storeTokens(token: string, refreshToken: string): Promise<void> {
    try {
      await SecureStore.setItemAsync('auth_token', token);
      await SecureStore.setItemAsync('refresh_token', refreshToken);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw AppError.fromBusinessError(
        ErrorCode.STORAGE_ERROR,
        'Failed to store authentication tokens',
        'Please try logging in again'
      );
    }
  }

  // Store user data
  private async storeUserData(user: AuthResponse['user']): Promise<void> {
    try {
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user data:', error);
      throw AppError.fromBusinessError(
        ErrorCode.STORAGE_ERROR,
        'Failed to store user data',
        'Please try again'
      );
    }
  }

  // Clear all stored data
  private async clearStoredData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('user_data');
    } catch (error) {
      console.error('Error clearing stored data:', error);
    }
  }

  // Validate current session
  async validateSession(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return false;
      }

      // Call a lightweight endpoint to validate token
      await apiClient.get('/auth/validate-session');
      return true;
    } catch (error) {
      // If validation fails, clear stored data
      await this.clearStoredData();
      return false;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance(); 