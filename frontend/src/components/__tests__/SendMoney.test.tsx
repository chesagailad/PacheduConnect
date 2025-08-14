import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SendMoney from '../SendMoney';

// Mock API calls
global.fetch = jest.fn();

// Mock router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
(global as any).localStorage = localStorageMock;

describe('SendMoney Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token');
  });

  describe('Initial Rendering', () => {
    test('Should render send money form', () => {
      render(<SendMoney />);
      
      expect(screen.getByText('Send Money')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Recipient email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Send')).toBeInTheDocument();
    });

    test('Should display currency selector', () => {
      render(<SendMoney />);
      
      expect(screen.getByLabelText('Currency')).toBeInTheDocument();
      expect(screen.getByDisplayValue('USD')).toBeInTheDocument();
    });

    test('Should show fee calculator', () => {
      render(<SendMoney />);
      
      expect(screen.getByText('Fee Calculator')).toBeInTheDocument();
      expect(screen.getByText('Transfer Fee:')).toBeInTheDocument();
      expect(screen.getByText('Total Amount:')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('Should validate required fields', async () => {
      render(<SendMoney />);
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Recipient email is required')).toBeInTheDocument();
        expect(screen.getByText('Amount is required')).toBeInTheDocument();
      });
    });

    test('Should validate email format', async () => {
      render(<SendMoney />);
      
      const emailInput = screen.getByPlaceholderText('Recipient email');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    test('Should validate amount is positive', async () => {
      render(<SendMoney />);
      
      const amountInput = screen.getByPlaceholderText('Amount');
      fireEvent.change(amountInput, { target: { value: '-100' } });
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Amount must be positive')).toBeInTheDocument();
      });
    });

    test('Should validate minimum amount', async () => {
      render(<SendMoney />);
      
      const amountInput = screen.getByPlaceholderText('Amount');
      fireEvent.change(amountInput, { target: { value: '5' } });
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Minimum amount is $10')).toBeInTheDocument();
      });
    });

    test('Should validate maximum amount', async () => {
      render(<SendMoney />);
      
      const amountInput = screen.getByPlaceholderText('Amount');
      fireEvent.change(amountInput, { target: { value: '100000' } });
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Maximum amount is $50,000')).toBeInTheDocument();
      });
    });
  });

  describe('Recipient Verification', () => {
    test('Should verify recipient exists', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { id: 'user-123', name: 'John Doe', email: 'john@example.com' }
        ])
      });

      render(<SendMoney />);
      
      const emailInput = screen.getByPlaceholderText('Recipient email');
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      
      const amountInput = screen.getByPlaceholderText('Amount');
      fireEvent.change(amountInput, { target: { value: '100' } });
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Recipient verified: John Doe')).toBeInTheDocument();
      });
    });

    test('Should handle recipient not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      });

      render(<SendMoney />);
      
      const emailInput = screen.getByPlaceholderText('Recipient email');
      fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });
      
      const amountInput = screen.getByPlaceholderText('Amount');
      fireEvent.change(amountInput, { target: { value: '100' } });
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Recipient not found')).toBeInTheDocument();
      });
    });
  });

  describe('Fee Calculation', () => {
    test('Should calculate fees correctly', async () => {
      render(<SendMoney />);
      
      const amountInput = screen.getByPlaceholderText('Amount');
      fireEvent.change(amountInput, { target: { value: '1000' } });
      
      await waitFor(() => {
        expect(screen.getByText('Transfer Fee: $30.00')).toBeInTheDocument();
        expect(screen.getByText('Total Amount: $1030.00')).toBeInTheDocument();
      });
    });

    test('Should update fees when currency changes', async () => {
      render(<SendMoney />);
      
      const currencySelect = screen.getByLabelText('Currency');
      fireEvent.change(currencySelect, { target: { value: 'ZAR' } });
      
      const amountInput = screen.getByPlaceholderText('Amount');
      fireEvent.change(amountInput, { target: { value: '1000' } });
      
      await waitFor(() => {
        expect(screen.getByText('Transfer Fee: R30.00')).toBeInTheDocument();
        expect(screen.getByText('Total Amount: R1030.00')).toBeInTheDocument();
      });
    });

    test('Should apply minimum fee', async () => {
      render(<SendMoney />);
      
      const amountInput = screen.getByPlaceholderText('Amount');
      fireEvent.change(amountInput, { target: { value: '10' } });
      
      await waitFor(() => {
        expect(screen.getByText('Transfer Fee: $0.30')).toBeInTheDocument();
        expect(screen.getByText('Total Amount: $10.30')).toBeInTheDocument();
      });
    });
  });

  describe('Transaction Processing', () => {
    test('Should process successful transaction', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([
            { id: 'user-123', name: 'John Doe', email: 'john@example.com' }
          ])
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            transactionId: 'txn-123456',
            message: 'Transaction completed successfully'
          })
        });

      render(<SendMoney />);
      
      const emailInput = screen.getByPlaceholderText('Recipient email');
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      
      const amountInput = screen.getByPlaceholderText('Amount');
      fireEvent.change(amountInput, { target: { value: '100' } });
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Transaction completed successfully')).toBeInTheDocument();
      });
    });

    test('Should handle transaction failure', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([
            { id: 'user-123', name: 'John Doe', email: 'john@example.com' }
          ])
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            error: 'Insufficient balance'
          })
        });

      render(<SendMoney />);
      
      const emailInput = screen.getByPlaceholderText('Recipient email');
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      
      const amountInput = screen.getByPlaceholderText('Amount');
      fireEvent.change(amountInput, { target: { value: '100' } });
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Insufficient balance')).toBeInTheDocument();
      });
    });

    test('Should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<SendMoney />);
      
      const emailInput = screen.getByPlaceholderText('Recipient email');
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      
      const amountInput = screen.getByPlaceholderText('Amount');
      fireEvent.change(amountInput, { target: { value: '100' } });
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Network error occurred')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('Should show loading state during verification', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ([
            { id: 'user-123', name: 'John Doe', email: 'john@example.com' }
          ])
        }), 100))
      );

      render(<SendMoney />);
      
      const emailInput = screen.getByPlaceholderText('Recipient email');
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      
      const amountInput = screen.getByPlaceholderText('Amount');
      fireEvent.change(amountInput, { target: { value: '100' } });
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      expect(screen.getByText('Verifying recipient...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Verifying recipient...')).not.toBeInTheDocument();
      });
    });

    test('Should show loading state during transaction', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([
            { id: 'user-123', name: 'John Doe', email: 'john@example.com' }
          ])
        })
        .mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            ok: true,
            json: async () => ({
              success: true,
              transactionId: 'txn-123456'
            })
          }), 100))
        );

      render(<SendMoney />);
      
      const emailInput = screen.getByPlaceholderText('Recipient email');
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      
      const amountInput = screen.getByPlaceholderText('Amount');
      fireEvent.change(amountInput, { target: { value: '100' } });
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      expect(screen.getByText('Processing transaction...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Processing transaction...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Success Handling', () => {
    test('Should redirect to transactions page on success', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([
            { id: 'user-123', name: 'John Doe', email: 'john@example.com' }
          ])
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            transactionId: 'txn-123456'
          })
        });

      render(<SendMoney />);
      
      const emailInput = screen.getByPlaceholderText('Recipient email');
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      
      const amountInput = screen.getByPlaceholderText('Amount');
      fireEvent.change(amountInput, { target: { value: '100' } });
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/transactions');
      });
    });

    test('Should clear form after successful transaction', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([
            { id: 'user-123', name: 'John Doe', email: 'john@example.com' }
          ])
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            transactionId: 'txn-123456'
          })
        });

      render(<SendMoney />);
      
      const emailInput = screen.getByPlaceholderText('Recipient email');
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      
      const amountInput = screen.getByPlaceholderText('Amount');
      fireEvent.change(amountInput, { target: { value: '100' } });
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(emailInput).toHaveValue('');
        expect(amountInput).toHaveValue('');
      });
    });
  });
}); 