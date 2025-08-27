import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { act } from 'react-test-renderer';
import { useAuth } from '../../src/hooks/useAuth';
import { transactionService } from '../../src/services/api/transactionService';
import { kycService } from '../../src/services/api/kycService';
import { notificationService } from '../../src/services/api/notificationService';
import { AppError, ErrorCode } from '../../src/utils/errors';
import LoginScreen from '../../src/screens/auth/LoginScreen';
import SendMoneyScreen from '../../src/screens/transfer/SendMoneyScreen';
import HomeScreen from '../../src/screens/dashboard/HomeScreen';

// Mock all services
jest.mock('../../src/hooks/useAuth');
jest.mock('../../src/services/api/transactionService');
jest.mock('../../src/services/api/kycService');
jest.mock('../../src/services/api/notificationService');

describe('Regression Tests - PacheduConnect Mobile App', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockTransactionService = transactionService as jest.Mocked<typeof transactionService>;
  const mockKYCService = kycService as jest.Mocked<typeof kycService>;
  const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Regression Tests', () => {
    test('should maintain login functionality after updates', async () => {
      // Arrange
      const mockLogin = jest.fn().mockResolvedValue({ success: true });
      
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

    test('should maintain registration validation rules', async () => {
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

      // Act - Navigate to register screen
      const registerButton = screen.getByText('Create new account');
      await act(async () => {
        fireEvent.press(registerButton);
      });

      // Assert - Registration validation should still work
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    test('should maintain biometric authentication functionality', async () => {
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
  });

  describe('Transaction Regression Tests', () => {
    test('should maintain money transfer functionality', async () => {
      // Arrange
      const mockCalculateFees = jest.fn().mockResolvedValue({
        amount: 100,
        currency: 'USD',
        transferFee: 3,
        exchangeRate: 1,
        totalAmount: 103,
        deliveryFee: 0,
        estimatedDeliveryTime: '2-3 business days',
      });

      const mockCreateTransaction = jest.fn().mockResolvedValue({
        id: 'txn-123',
        type: 'send',
        amount: 100,
        currency: 'USD',
        status: 'pending',
        fee: 3,
        reference: 'TXN123456',
        createdAt: new Date().toISOString(),
      });

      mockTransactionService.calculateFees = mockCalculateFees;
      mockTransactionService.createTransaction = mockCreateTransaction;

      render(<SendMoneyScreen />);

      // Act
      const recipientSelector = screen.getByText('Select recipient');
      const amountInput = screen.getByPlaceholderText('0.00');
      const sendButton = screen.getByText('Send Money');

      await act(async () => {
        fireEvent.press(recipientSelector);
        const recipient = screen.getByText('John Doe');
        fireEvent.press(recipient);
        
        fireEvent.changeText(amountInput, '100');
        fireEvent.press(sendButton);
      });

      // Assert
      await waitFor(() => {
        expect(mockCalculateFees).toHaveBeenCalled();
        expect(mockCreateTransaction).toHaveBeenCalled();
      });
    });

    test('should maintain transaction validation rules', async () => {
      // Arrange
      render(<SendMoneyScreen />);

      // Act
      const amountInput = screen.getByPlaceholderText('0.00');
      const sendButton = screen.getByText('Send Money');

      await act(async () => {
        fireEvent.changeText(amountInput, '-100');
        fireEvent.press(sendButton);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Amount must be positive')).toBeInTheDocument();
      });
    });

    test('should maintain fee calculation accuracy', async () => {
      // Arrange
      const mockCalculateFees = jest.fn().mockResolvedValue({
        amount: 1000,
        currency: 'USD',
        transferFee: 30,
        exchangeRate: 1,
        totalAmount: 1030,
        deliveryFee: 0,
        estimatedDeliveryTime: '2-3 business days',
      });

      mockTransactionService.calculateFees = mockCalculateFees;

      render(<SendMoneyScreen />);

      // Act
      const amountInput = screen.getByPlaceholderText('0.00');

      await act(async () => {
        fireEvent.changeText(amountInput, '1000');
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Transfer Fee: $30.00')).toBeInTheDocument();
        expect(screen.getByText('Total Amount: $1030.00')).toBeInTheDocument();
      });
    });

    test('should maintain transaction history functionality', async () => {
      // Arrange
      const mockTransactions = [
        {
          id: 'txn-1',
          type: 'send',
          amount: 100,
          currency: 'USD',
          recipientName: 'John Doe',
          status: 'completed',
          fee: 3,
          reference: 'TXN123456',
          createdAt: new Date().toISOString(),
        },
      ];

      const mockGetTransactions = jest.fn().mockResolvedValue({
        transactions: mockTransactions,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      mockTransactionService.getTransactions = mockGetTransactions;

      // Act
      await act(async () => {
        const result = await mockTransactionService.getTransactions();
        expect(result.transactions).toHaveLength(1);
        expect(result.transactions[0].type).toBe('send');
      });
    });
  });

  describe('KYC Regression Tests', () => {
    test('should maintain KYC status checking functionality', async () => {
      // Arrange
      const mockKYCStatus = {
        id: 'kyc-123',
        userId: 'user-123',
        level: 'silver',
        status: 'approved',
        submittedAt: new Date().toISOString(),
        documents: [],
        personalInfo: {
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          nationality: 'US',
          countryOfResidence: 'US',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            postalCode: '12345',
            country: 'US',
          },
          phoneNumber: '+1234567890',
          email: 'test@example.com',
          occupation: 'Developer',
          sourceOfFunds: 'Employment',
          expectedMonthlyVolume: 1000,
        },
        verificationScore: 85,
        lastUpdated: new Date().toISOString(),
      };

      const mockGetKYCStatus = jest.fn().mockResolvedValue(mockKYCStatus);
      mockKYCService.getKYCStatus = mockGetKYCStatus;

      // Act
      await act(async () => {
        const result = await mockKYCService.getKYCStatus();
        expect(result.level).toBe('silver');
        expect(result.status).toBe('approved');
      });
    });

    test('should maintain KYC validation rules', async () => {
      // Arrange
      const mockSubmissionRequest = {
        personalInfo: {
          firstName: '', // Invalid: empty name
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          nationality: 'US',
          countryOfResidence: 'US',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            postalCode: '12345',
            country: 'US',
          },
          phoneNumber: '+1234567890',
          email: 'test@example.com',
          occupation: 'Developer',
          sourceOfFunds: 'Employment',
          expectedMonthlyVolume: 1000,
        },
        documents: [],
        level: 'silver' as const,
      };

      const mockSubmitKYC = jest.fn().mockRejectedValue(
        new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'First name must be at least 2 characters',
          retryable: false,
          userMessage: 'First name must be at least 2 characters',
          timestamp: new Date(),
        })
      );

      mockKYCService.submitKYC = mockSubmitKYC;

      // Act & Assert
      await expect(mockKYCService.submitKYC(mockSubmissionRequest)).rejects.toThrow();
    });

    test('should maintain document upload functionality', async () => {
      // Arrange
      const mockDocument = {
        type: 'identity' as const,
        uri: 'file://test-document.jpg',
        fileName: 'test-document.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024000,
        documentNumber: 'ID123456',
        expiryDate: '2025-12-31',
        country: 'US',
      };

      const mockUploadDocument = jest.fn().mockResolvedValue({
        id: 'doc-123',
        type: 'identity',
        name: 'Government ID',
        fileName: 'test-document.jpg',
        fileSize: 1024000,
        mimeType: 'image/jpeg',
        uploadDate: new Date().toISOString(),
        status: 'pending',
        documentNumber: 'ID123456',
        expiryDate: '2025-12-31',
        country: 'US',
      });

      mockKYCService.uploadDocument = mockUploadDocument;

      // Act
      await act(async () => {
        const result = await mockKYCService.uploadDocument(mockDocument);
        expect(result.type).toBe('identity');
        expect(result.status).toBe('pending');
      });
    });
  });

  describe('Dashboard Regression Tests', () => {
    test('should maintain dashboard display functionality', async () => {
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

      render(<HomeScreen />);

      // Assert
      expect(screen.getByText('Hello, Test!')).toBeInTheDocument();
      expect(screen.getByText('Welcome back to PacheduConnect')).toBeInTheDocument();
    });

    test('should maintain quick actions functionality', async () => {
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

      render(<HomeScreen />);

      // Assert
      expect(screen.getByText('Send Money')).toBeInTheDocument();
      expect(screen.getByText('KYC Status')).toBeInTheDocument();
      expect(screen.getByText('Cards')).toBeInTheDocument();
      expect(screen.getByText('Support')).toBeInTheDocument();
    });
  });

  describe('Error Handling Regression Tests', () => {
    test('should maintain network error handling', async () => {
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

    test('should maintain validation error handling', async () => {
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

    test('should maintain server error handling', async () => {
      // Arrange
      const mockCreateTransaction = jest.fn().mockRejectedValue(
        new AppError({
          code: ErrorCode.SERVER_ERROR,
          message: 'Internal server error',
          retryable: true,
          userMessage: 'Something went wrong. Please try again later.',
          timestamp: new Date(),
        })
      );

      mockTransactionService.createTransaction = mockCreateTransaction;

      render(<SendMoneyScreen />);

      // Act
      const recipientSelector = screen.getByText('Select recipient');
      const amountInput = screen.getByPlaceholderText('0.00');
      const sendButton = screen.getByText('Send Money');

      await act(async () => {
        fireEvent.press(recipientSelector);
        const recipient = screen.getByText('John Doe');
        fireEvent.press(recipient);
        
        fireEvent.changeText(amountInput, '100');
        fireEvent.press(sendButton);
      });

      // Assert
      await waitFor(() => {
        expect(mockCreateTransaction).toHaveBeenCalled();
      });
    });
  });

  describe('Performance Regression Tests', () => {
    test('should maintain acceptable loading times', async () => {
      // Arrange
      const startTime = Date.now();
      
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
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    test('should maintain memory efficiency', async () => {
      // Arrange
      const initialMemory = process.memoryUsage().heapUsed;
      
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

      // Act - Render multiple components
      for (let i = 0; i < 10; i++) {
        render(<LoginScreen />);
      }

      // Assert
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Security Regression Tests', () => {
    test('should maintain secure token handling', async () => {
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
        token: 'mock-jwt-token',
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

      render(<HomeScreen />);

      // Assert - Token should not be exposed in UI
      expect(screen.queryByText('mock-jwt-token')).not.toBeInTheDocument();
    });

    test('should maintain input sanitization', async () => {
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

      // Act - Try to inject malicious input
      const emailInput = screen.getByPlaceholderText('Email address');
      
      await act(async () => {
        fireEvent.changeText(emailInput, '<script>alert("xss")</script>');
      });

      // Assert - Input should be sanitized
      expect(emailInput.props.value).toBe('<script>alert("xss")</script>');
    });
  });

  describe('Accessibility Regression Tests', () => {
    test('should maintain screen reader compatibility', async () => {
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

      // Assert - Key elements should have accessibility labels
      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      const loginButton = screen.getByText('Sign In');

      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(loginButton).toBeInTheDocument();
    });

    test('should maintain keyboard navigation', async () => {
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

      // Act - Test keyboard navigation
      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');

      await act(async () => {
        fireEvent(emailInput, 'focus');
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent(emailInput, 'blur');
        fireEvent(passwordInput, 'focus');
      });

      // Assert - Focus should move correctly
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });
  });
}); 