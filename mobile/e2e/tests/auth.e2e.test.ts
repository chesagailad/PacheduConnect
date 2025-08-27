import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { act } from 'react-test-renderer';
import { useAuth } from '../../src/hooks/useAuth';
import { authService } from '../../src/services/api/authService';
import { AppError, ErrorCode } from '../../src/utils/errors';
import LoginScreen from '../../src/screens/auth/LoginScreen';
import RegisterScreen from '../../src/screens/auth/RegisterScreen';

// Mock the auth hook
jest.mock('../../src/hooks/useAuth');
jest.mock('../../src/services/api/authService');

describe('Authentication E2E Tests', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockAuthService = authService as jest.Mocked<typeof authService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Flow', () => {
    test('should successfully login with valid credentials', async () => {
      // Arrange
      const mockLogin = jest.fn().mockResolvedValue({ success: true });
      const mockCheckBiometricAvailability = jest.fn().mockResolvedValue(true);
      
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        login: mockLogin,
        checkBiometricAvailability: mockCheckBiometricAvailability,
        register: jest.fn(),
        logout: jest.fn(),
        authenticateWithBiometrics: jest.fn(),
        updateUser: jest.fn(),
        refreshUserData: jest.fn(),
        forgotPassword: jest.fn(),
        changePassword: jest.fn(),
      });

      render(<LoginScreen />);

      // Act
      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      const loginButton = screen.getByText('Sign In');

      await act(async () => {
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(passwordInput, 'Password123');
        fireEvent.press(loginButton);
      });

      // Assert
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'Password123');
      });
    });

    test('should show validation errors for invalid email', async () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        login: jest.fn(),
        checkBiometricAvailability: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        authenticateWithBiometrics: jest.fn(),
        updateUser: jest.fn(),
        refreshUserData: jest.fn(),
        forgotPassword: jest.fn(),
        changePassword: jest.fn(),
      });

      render(<LoginScreen />);

      // Act
      const emailInput = screen.getByPlaceholderText('Email address');
      const loginButton = screen.getByText('Sign In');

      await act(async () => {
        fireEvent.changeText(emailInput, 'invalid-email');
        fireEvent.press(loginButton);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    test('should show validation errors for empty password', async () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        login: jest.fn(),
        checkBiometricAvailability: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        authenticateWithBiometrics: jest.fn(),
        updateUser: jest.fn(),
        refreshUserData: jest.fn(),
        forgotPassword: jest.fn(),
        changePassword: jest.fn(),
      });

      render(<LoginScreen />);

      // Act
      const emailInput = screen.getByPlaceholderText('Email address');
      const loginButton = screen.getByText('Sign In');

      await act(async () => {
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.press(loginButton);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    test('should handle login failure with server error', async () => {
      // Arrange
      const mockLogin = jest.fn().mockResolvedValue({ 
        success: false, 
        error: 'Invalid credentials',
        code: ErrorCode.INVALID_CREDENTIALS 
      });
      
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        login: mockLogin,
        checkBiometricAvailability: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        authenticateWithBiometrics: jest.fn(),
        updateUser: jest.fn(),
        refreshUserData: jest.fn(),
        forgotPassword: jest.fn(),
        changePassword: jest.fn(),
      });

      render(<LoginScreen />);

      // Act
      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      const loginButton = screen.getByText('Sign In');

      await act(async () => {
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(passwordInput, 'wrongpassword');
        fireEvent.press(loginButton);
      });

      // Assert
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
      });
    });

    test('should handle network error during login', async () => {
      // Arrange
      const mockLogin = jest.fn().mockRejectedValue(
        new AppError({
          code: ErrorCode.NETWORK_ERROR,
          message: 'Network connection failed',
          retryable: true,
          userMessage: 'Please check your internet connection and try again',
          timestamp: new Date(),
        })
      );
      
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        login: mockLogin,
        checkBiometricAvailability: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        authenticateWithBiometrics: jest.fn(),
        updateUser: jest.fn(),
        refreshUserData: jest.fn(),
        forgotPassword: jest.fn(),
        changePassword: jest.fn(),
      });

      render(<LoginScreen />);

      // Act
      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      const loginButton = screen.getByText('Sign In');

      await act(async () => {
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(passwordInput, 'Password123');
        fireEvent.press(loginButton);
      });

      // Assert
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'Password123');
      });
    });

    test('should show loading state during login', async () => {
      // Arrange
      const mockLogin = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );
      
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        login: mockLogin,
        checkBiometricAvailability: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        authenticateWithBiometrics: jest.fn(),
        updateUser: jest.fn(),
        refreshUserData: jest.fn(),
        forgotPassword: jest.fn(),
        changePassword: jest.fn(),
      });

      render(<LoginScreen />);

      // Act
      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      const loginButton = screen.getByText('Sign In');

      await act(async () => {
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(passwordInput, 'Password123');
        fireEvent.press(loginButton);
      });

      // Assert
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });

  describe('Registration Flow', () => {
    test('should successfully register with valid data', async () => {
      // Arrange
      const mockRegister = jest.fn().mockResolvedValue({ success: true });
      
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        login: jest.fn(),
        checkBiometricAvailability: jest.fn(),
        register: mockRegister,
        logout: jest.fn(),
        authenticateWithBiometrics: jest.fn(),
        updateUser: jest.fn(),
        refreshUserData: jest.fn(),
        forgotPassword: jest.fn(),
        changePassword: jest.fn(),
      });

      render(<RegisterScreen />);

      // Act
      const nameInput = screen.getByPlaceholderText('Full name');
      const emailInput = screen.getByPlaceholderText('Email address');
      const phoneInput = screen.getByPlaceholderText('Phone number');
      const passwordInput = screen.getByPlaceholderText('Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password');
      const registerButton = screen.getByText('Create Account');

      await act(async () => {
        fireEvent.changeText(nameInput, 'Test User');
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(phoneInput, '+1234567890');
        fireEvent.changeText(passwordInput, 'Password123');
        fireEvent.changeText(confirmPasswordInput, 'Password123');
        fireEvent.press(registerButton);
      });

      // Assert
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890',
          password: 'Password123',
        });
      });
    });

    test('should show validation errors for weak password', async () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        login: jest.fn(),
        checkBiometricAvailability: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        authenticateWithBiometrics: jest.fn(),
        updateUser: jest.fn(),
        refreshUserData: jest.fn(),
        forgotPassword: jest.fn(),
        changePassword: jest.fn(),
      });

      render(<RegisterScreen />);

      // Act
      const passwordInput = screen.getByPlaceholderText('Password');
      const registerButton = screen.getByText('Create Account');

      await act(async () => {
        fireEvent.changeText(passwordInput, 'weak');
        fireEvent.press(registerButton);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
      });
    });

    test('should show validation errors for password mismatch', async () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        login: jest.fn(),
        checkBiometricAvailability: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        authenticateWithBiometrics: jest.fn(),
        updateUser: jest.fn(),
        refreshUserData: jest.fn(),
        forgotPassword: jest.fn(),
        changePassword: jest.fn(),
      });

      render(<RegisterScreen />);

      // Act
      const passwordInput = screen.getByPlaceholderText('Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password');
      const registerButton = screen.getByText('Create Account');

      await act(async () => {
        fireEvent.changeText(passwordInput, 'Password123');
        fireEvent.changeText(confirmPasswordInput, 'DifferentPassword123');
        fireEvent.press(registerButton);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    test('should handle registration failure with existing email', async () => {
      // Arrange
      const mockRegister = jest.fn().mockResolvedValue({ 
        success: false, 
        error: 'Email already exists',
        code: ErrorCode.VALIDATION_ERROR 
      });
      
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        login: jest.fn(),
        checkBiometricAvailability: jest.fn(),
        register: mockRegister,
        logout: jest.fn(),
        authenticateWithBiometrics: jest.fn(),
        updateUser: jest.fn(),
        refreshUserData: jest.fn(),
        forgotPassword: jest.fn(),
        changePassword: jest.fn(),
      });

      render(<RegisterScreen />);

      // Act
      const nameInput = screen.getByPlaceholderText('Full name');
      const emailInput = screen.getByPlaceholderText('Email address');
      const phoneInput = screen.getByPlaceholderText('Phone number');
      const passwordInput = screen.getByPlaceholderText('Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password');
      const registerButton = screen.getByText('Create Account');

      await act(async () => {
        fireEvent.changeText(nameInput, 'Test User');
        fireEvent.changeText(emailInput, 'existing@example.com');
        fireEvent.changeText(phoneInput, '+1234567890');
        fireEvent.changeText(passwordInput, 'Password123');
        fireEvent.changeText(confirmPasswordInput, 'Password123');
        fireEvent.press(registerButton);
      });

      // Assert
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'existing@example.com',
          phone: '+1234567890',
          password: 'Password123',
        });
      });
    });
  });

  describe('Biometric Authentication', () => {
    test('should show biometric option when available', async () => {
      // Arrange
      const mockCheckBiometricAvailability = jest.fn().mockResolvedValue(true);
      const mockAuthenticateWithBiometrics = jest.fn().mockResolvedValue(true);
      
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        login: jest.fn(),
        checkBiometricAvailability: mockCheckBiometricAvailability,
        register: jest.fn(),
        logout: jest.fn(),
        authenticateWithBiometrics: mockAuthenticateWithBiometrics,
        updateUser: jest.fn(),
        refreshUserData: jest.fn(),
        forgotPassword: jest.fn(),
        changePassword: jest.fn(),
      });

      render(<LoginScreen />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Sign in with biometrics')).toBeInTheDocument();
      });
    });

    test('should handle biometric authentication success', async () => {
      // Arrange
      const mockAuthenticateWithBiometrics = jest.fn().mockResolvedValue(true);
      
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        login: jest.fn(),
        checkBiometricAvailability: jest.fn().mockResolvedValue(true),
        register: jest.fn(),
        logout: jest.fn(),
        authenticateWithBiometrics: mockAuthenticateWithBiometrics,
        updateUser: jest.fn(),
        refreshUserData: jest.fn(),
        forgotPassword: jest.fn(),
        changePassword: jest.fn(),
      });

      render(<LoginScreen />);

      // Act
      const biometricButton = screen.getByText('Sign in with biometrics');

      await act(async () => {
        fireEvent.press(biometricButton);
      });

      // Assert
      await waitFor(() => {
        expect(mockAuthenticateWithBiometrics).toHaveBeenCalled();
      });
    });

    test('should handle biometric authentication failure', async () => {
      // Arrange
      const mockAuthenticateWithBiometrics = jest.fn().mockResolvedValue(false);
      
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        login: jest.fn(),
        checkBiometricAvailability: jest.fn().mockResolvedValue(true),
        register: jest.fn(),
        logout: jest.fn(),
        authenticateWithBiometrics: mockAuthenticateWithBiometrics,
        updateUser: jest.fn(),
        refreshUserData: jest.fn(),
        forgotPassword: jest.fn(),
        changePassword: jest.fn(),
      });

      render(<LoginScreen />);

      // Act
      const biometricButton = screen.getByText('Sign in with biometrics');

      await act(async () => {
        fireEvent.press(biometricButton);
      });

      // Assert
      await waitFor(() => {
        expect(mockAuthenticateWithBiometrics).toHaveBeenCalled();
      });
    });
  });

  describe('Password Reset Flow', () => {
    test('should successfully send password reset email', async () => {
      // Arrange
      const mockForgotPassword = jest.fn().mockResolvedValue({ success: true });
      
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        login: jest.fn(),
        checkBiometricAvailability: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        authenticateWithBiometrics: jest.fn(),
        updateUser: jest.fn(),
        refreshUserData: jest.fn(),
        forgotPassword: mockForgotPassword,
        changePassword: jest.fn(),
      });

      render(<LoginScreen />);

      // Act
      const forgotPasswordLink = screen.getByText('Forgot password?');

      await act(async () => {
        fireEvent.press(forgotPasswordLink);
      });

      // Assert
      await waitFor(() => {
        expect(mockForgotPassword).toHaveBeenCalled();
      });
    });

    test('should handle password reset with invalid email', async () => {
      // Arrange
      const mockForgotPassword = jest.fn().mockResolvedValue({ 
        success: false, 
        error: 'Email not found',
        code: ErrorCode.VALIDATION_ERROR 
      });
      
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        login: jest.fn(),
        checkBiometricAvailability: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        authenticateWithBiometrics: jest.fn(),
        updateUser: jest.fn(),
        refreshUserData: jest.fn(),
        forgotPassword: mockForgotPassword,
        changePassword: jest.fn(),
      });

      render(<LoginScreen />);

      // Act
      const forgotPasswordLink = screen.getByText('Forgot password?');

      await act(async () => {
        fireEvent.press(forgotPasswordLink);
      });

      // Assert
      await waitFor(() => {
        expect(mockForgotPassword).toHaveBeenCalled();
      });
    });
  });

  describe('Session Management', () => {
    test('should automatically login with stored credentials', async () => {
      // Arrange
      const mockUser = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        kycStatus: 'approved' as const,
        balance: 1000,
      };

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
        token: 'mock-token',
        login: jest.fn(),
        checkBiometricAvailability: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        authenticateWithBiometrics: jest.fn(),
        updateUser: jest.fn(),
        refreshUserData: jest.fn(),
        forgotPassword: jest.fn(),
        changePassword: jest.fn(),
      });

      render(<LoginScreen />);

      // Assert
      expect(screen.getByText('Welcome back!')).toBeInTheDocument();
    });

    test('should handle session expiration', async () => {
      // Arrange
      const mockLogout = jest.fn();
      
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        login: jest.fn(),
        checkBiometricAvailability: jest.fn(),
        register: jest.fn(),
        logout: mockLogout,
        authenticateWithBiometrics: jest.fn(),
        updateUser: jest.fn(),
        refreshUserData: jest.fn(),
        forgotPassword: jest.fn(),
        changePassword: jest.fn(),
      });

      render(<LoginScreen />);

      // Assert
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });
}); 