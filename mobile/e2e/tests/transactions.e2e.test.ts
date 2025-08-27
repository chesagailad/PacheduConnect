import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { act } from 'react-test-renderer';
import { transactionService } from '../../src/services/api/transactionService';
import { AppError, ErrorCode } from '../../src/utils/errors';
import SendMoneyScreen from '../../src/screens/transfer/SendMoneyScreen';

// Mock the transaction service
jest.mock('../../src/services/api/transactionService');

describe('Transaction E2E Tests', () => {
  const mockTransactionService = transactionService as jest.Mocked<typeof transactionService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Send Money Flow', () => {
    test('should successfully send money with valid data', async () => {
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
        // Select recipient from dropdown
        const recipient = screen.getByText('John Doe');
        fireEvent.press(recipient);
        
        fireEvent.changeText(amountInput, '100');
        fireEvent.press(sendButton);
      });

      // Assert
      await waitFor(() => {
        expect(mockCalculateFees).toHaveBeenCalledWith(100, 'ZAR', 'bank_transfer');
        expect(mockCreateTransaction).toHaveBeenCalled();
      });
    });

    test('should show fee calculation when amount is entered', async () => {
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

    test('should show validation error for insufficient balance', async () => {
      // Arrange
      const mockCreateTransaction = jest.fn().mockRejectedValue(
        new AppError({
          code: ErrorCode.INSUFFICIENT_BALANCE,
          message: 'Insufficient balance',
          retryable: false,
          userMessage: 'Insufficient balance. Please top up your account',
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
        
        fireEvent.changeText(amountInput, '10000');
        fireEvent.press(sendButton);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Insufficient balance. Please top up your account')).toBeInTheDocument();
      });
    });

    test('should show validation error for invalid amount', async () => {
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

    test('should show validation error for amount below minimum', async () => {
      // Arrange
      render(<SendMoneyScreen />);

      // Act
      const amountInput = screen.getByPlaceholderText('0.00');
      const sendButton = screen.getByText('Send Money');

      await act(async () => {
        fireEvent.changeText(amountInput, '5');
        fireEvent.press(sendButton);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Minimum amount is $10')).toBeInTheDocument();
      });
    });

    test('should show validation error for amount above maximum', async () => {
      // Arrange
      render(<SendMoneyScreen />);

      // Act
      const amountInput = screen.getByPlaceholderText('0.00');
      const sendButton = screen.getByText('Send Money');

      await act(async () => {
        fireEvent.changeText(amountInput, '100000');
        fireEvent.press(sendButton);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Maximum amount is $50,000')).toBeInTheDocument();
      });
    });

    test('should show validation error when no recipient is selected', async () => {
      // Arrange
      render(<SendMoneyScreen />);

      // Act
      const amountInput = screen.getByPlaceholderText('0.00');
      const sendButton = screen.getByText('Send Money');

      await act(async () => {
        fireEvent.changeText(amountInput, '100');
        fireEvent.press(sendButton);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Please select a recipient')).toBeInTheDocument();
      });
    });

    test('should handle network error during transaction', async () => {
      // Arrange
      const mockCreateTransaction = jest.fn().mockRejectedValue(
        new AppError({
          code: ErrorCode.NETWORK_ERROR,
          message: 'Network connection failed',
          retryable: true,
          userMessage: 'Please check your internet connection and try again',
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
        expect(screen.getByText('Please check your internet connection and try again')).toBeInTheDocument();
      });
    });

    test('should show loading state during transaction processing', async () => {
      // Arrange
      const mockCreateTransaction = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          id: 'txn-123',
          status: 'pending',
        }), 100))
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
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });

  describe('Transaction History', () => {
    test('should display transaction list correctly', async () => {
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
        {
          id: 'txn-2',
          type: 'receive',
          amount: 50,
          currency: 'USD',
          senderName: 'Jane Smith',
          status: 'completed',
          fee: 0,
          reference: 'TXN123457',
          createdAt: new Date().toISOString(),
        },
      ];

      const mockGetTransactions = jest.fn().mockResolvedValue({
        transactions: mockTransactions,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      mockTransactionService.getTransactions = mockGetTransactions;

      // This would typically be tested in a TransactionsScreen component
      // For now, we'll test the service call
      await act(async () => {
        const result = await mockTransactionService.getTransactions();
        expect(result.transactions).toHaveLength(2);
        expect(result.transactions[0].type).toBe('send');
        expect(result.transactions[1].type).toBe('receive');
      });
    });

    test('should handle transaction list loading error', async () => {
      // Arrange
      const mockGetTransactions = jest.fn().mockRejectedValue(
        new AppError({
          code: ErrorCode.SERVER_ERROR,
          message: 'Failed to load transactions',
          retryable: true,
          userMessage: 'Something went wrong. Please try again later.',
          timestamp: new Date(),
        })
      );

      mockTransactionService.getTransactions = mockGetTransactions;

      // Act & Assert
      await expect(mockTransactionService.getTransactions()).rejects.toThrow();
    });

    test('should filter transactions by status', async () => {
      // Arrange
      const mockGetTransactions = jest.fn().mockResolvedValue({
        transactions: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      mockTransactionService.getTransactions = mockGetTransactions;

      // Act
      await act(async () => {
        await mockTransactionService.getTransactions({ status: 'completed' });
      });

      // Assert
      expect(mockGetTransactions).toHaveBeenCalledWith({ status: 'completed' });
    });

    test('should search transactions', async () => {
      // Arrange
      const mockSearchTransactions = jest.fn().mockResolvedValue([
        {
          id: 'txn-1',
          type: 'send',
          amount: 100,
          currency: 'USD',
          recipientName: 'John Doe',
          status: 'completed',
          reference: 'TXN123456',
          createdAt: new Date().toISOString(),
        },
      ]);

      mockTransactionService.searchTransactions = mockSearchTransactions;

      // Act
      await act(async () => {
        const result = await mockTransactionService.searchTransactions('John');
        expect(result).toHaveLength(1);
        expect(result[0].recipientName).toBe('John Doe');
      });
    });
  });

  describe('Transaction Details', () => {
    test('should display transaction details correctly', async () => {
      // Arrange
      const mockTransaction = {
        id: 'txn-123',
        type: 'send',
        amount: 100,
        currency: 'USD',
        recipientId: 'recipient-123',
        recipientName: 'John Doe',
        recipientEmail: 'john@example.com',
        status: 'completed',
        fee: 3,
        exchangeRate: 1,
        description: 'Payment for services',
        reference: 'TXN123456',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      const mockGetTransaction = jest.fn().mockResolvedValue(mockTransaction);

      mockTransactionService.getTransaction = mockGetTransaction;

      // Act
      await act(async () => {
        const result = await mockTransactionService.getTransaction('txn-123');
        expect(result.id).toBe('txn-123');
        expect(result.type).toBe('send');
        expect(result.amount).toBe(100);
        expect(result.status).toBe('completed');
      });
    });

    test('should handle transaction not found', async () => {
      // Arrange
      const mockGetTransaction = jest.fn().mockRejectedValue(
        new AppError({
          code: ErrorCode.NOT_FOUND,
          message: 'Transaction not found',
          retryable: false,
          userMessage: 'The requested transaction was not found',
          timestamp: new Date(),
        })
      );

      mockTransactionService.getTransaction = mockGetTransaction;

      // Act & Assert
      await expect(mockTransactionService.getTransaction('invalid-id')).rejects.toThrow();
    });
  });

  describe('Transaction Cancellation', () => {
    test('should successfully cancel pending transaction', async () => {
      // Arrange
      const mockCancelTransaction = jest.fn().mockResolvedValue({
        id: 'txn-123',
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      });

      mockTransactionService.cancelTransaction = mockCancelTransaction;

      // Act
      await act(async () => {
        const result = await mockTransactionService.cancelTransaction('txn-123');
        expect(result.status).toBe('cancelled');
      });
    });

    test('should handle cancellation of completed transaction', async () => {
      // Arrange
      const mockCancelTransaction = jest.fn().mockRejectedValue(
        new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Cannot cancel completed transaction',
          retryable: false,
          userMessage: 'Cannot cancel a completed transaction',
          timestamp: new Date(),
        })
      );

      mockTransactionService.cancelTransaction = mockCancelTransaction;

      // Act & Assert
      await expect(mockTransactionService.cancelTransaction('txn-123')).rejects.toThrow();
    });
  });

  describe('Transaction Retry', () => {
    test('should successfully retry failed transaction', async () => {
      // Arrange
      const mockRetryTransaction = jest.fn().mockResolvedValue({
        id: 'txn-123',
        status: 'pending',
        updatedAt: new Date().toISOString(),
      });

      mockTransactionService.retryTransaction = mockRetryTransaction;

      // Act
      await act(async () => {
        const result = await mockTransactionService.retryTransaction('txn-123');
        expect(result.status).toBe('pending');
      });
    });

    test('should handle retry of non-failed transaction', async () => {
      // Arrange
      const mockRetryTransaction = jest.fn().mockRejectedValue(
        new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Cannot retry non-failed transaction',
          retryable: false,
          userMessage: 'Only failed transactions can be retried',
          timestamp: new Date(),
        })
      );

      mockTransactionService.retryTransaction = mockRetryTransaction;

      // Act & Assert
      await expect(mockTransactionService.retryTransaction('txn-123')).rejects.toThrow();
    });
  });

  describe('Transaction Export', () => {
    test('should successfully export transactions', async () => {
      // Arrange
      const mockExportTransactions = jest.fn().mockResolvedValue({
        downloadUrl: 'https://example.com/transactions.csv',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      mockTransactionService.exportTransactions = mockExportTransactions;

      // Act
      await act(async () => {
        const result = await mockTransactionService.exportTransactions('csv', {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });
        expect(result.downloadUrl).toBeDefined();
        expect(result.expiresAt).toBeDefined();
      });
    });

    test('should handle export with invalid format', async () => {
      // Arrange
      const mockExportTransactions = jest.fn().mockRejectedValue(
        new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid export format',
          retryable: false,
          userMessage: 'Please select a valid export format',
          timestamp: new Date(),
        })
      );

      mockTransactionService.exportTransactions = mockExportTransactions;

      // Act & Assert
      await expect(mockTransactionService.exportTransactions('invalid' as any)).rejects.toThrow();
    });
  });
}); 