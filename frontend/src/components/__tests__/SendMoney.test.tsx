import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SendMoney from '../SendMoney';

// Mock API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn((key: string) => {
    if (key === 'token') return 'mock-token';
    return null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
(global as any).localStorage = localStorageMock;

describe('SendMoney Component Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token');
    mockFetch.mockClear();
  });

  afterEach(() => {
    localStorageMock.getItem.mockClear();
  });

  test('Should render without infinite re-render', () => {
    render(<SendMoney />);
    expect(screen.getByText('Send Money')).toBeInTheDocument();
  });

  test('Should render all form elements', () => {
    render(<SendMoney />);
    
    // Check for main form elements
    expect(screen.getByLabelText(/Recipient Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Currency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message \(Optional\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verify/i })).toBeInTheDocument();
  });

  test('Should enable Send button with valid inputs', async () => {
    render(<SendMoney />);
    
    const recipientInput = screen.getByLabelText(/Recipient Email/i);
    const amountInput = screen.getByLabelText(/Amount/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    // Initially button should be disabled
    expect(sendButton).toBeDisabled();

    // Type valid recipient email
    await user.type(recipientInput, 'test@example.com');
    
    // Type valid amount
    await user.type(amountInput, '100');

    // Wait for validation to complete
    await waitFor(() => {
      expect(sendButton).toBeEnabled();
    });
  });

  test('Should keep Send button disabled with invalid inputs', async () => {
    render(<SendMoney />);
    
    const recipientInput = screen.getByLabelText(/Recipient Email/i);
    const amountInput = screen.getByLabelText(/Amount/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    // Initially button should be disabled
    expect(sendButton).toBeDisabled();

    // Type invalid recipient email
    await user.type(recipientInput, 'invalid-email');
    
    // Type invalid amount (too low)
    await user.type(amountInput, '5');
    
    // Trigger blur to show validation error
    await user.tab();

    // Button should remain disabled
    await waitFor(() => {
      expect(sendButton).toBeDisabled();
    });

    // Check for error messages
    expect(screen.getByText(/Minimum amount is \$10/i)).toBeInTheDocument();
  });

  test('Should show validation errors for empty required fields', async () => {
    render(<SendMoney />);
    
    const recipientInput = screen.getByLabelText(/Recipient Email/i);
    const amountInput = screen.getByLabelText(/Amount/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    // Focus and blur recipient field without entering data
    await user.click(recipientInput);
    await user.tab();

    // Focus and blur amount field without entering data
    await user.click(amountInput);
    await user.tab();

    // Button should remain disabled
    expect(sendButton).toBeDisabled();
  });

  test('Should handle recipient verification successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ exists: true })
    });

    render(<SendMoney />);
    
    const recipientInput = screen.getByLabelText(/Recipient Email/i);
    const verifyButton = screen.getByRole('button', { name: /Verify/i });

    // Type valid email
    await user.type(recipientInput, 'test@example.com');
    
    // Click verify button
    await user.click(verifyButton);

    // Wait for verification to complete
    await waitFor(() => {
      expect(screen.getByText(/✓ Recipient verified/i)).toBeInTheDocument();
    });

    // Verify API was called
    expect(mockFetch).toHaveBeenCalledWith('/api/recipients/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer null'
      },
      body: JSON.stringify({ email: 'test@example.com' })
    });
  });

  test('Should handle successful money transfer', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transactionId: 'txn_123456' })
    });

    render(<SendMoney />);
    
    const recipientInput = screen.getByLabelText(/Recipient Email/i);
    const amountInput = screen.getByLabelText(/Amount/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    // Fill form with valid data
    await user.type(recipientInput, 'test@example.com');
    await user.type(amountInput, '100');

    // Wait for button to be enabled
    await waitFor(() => {
      expect(sendButton).toBeEnabled();
    });

    // Click send button
    await user.click(sendButton);

    // Wait for API call and navigation
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/transactions/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer null'
        },
        body: JSON.stringify({
          recipientEmail: 'test@example.com',
          amount: 100,
          currency: 'USD',
          message: '',
          fee: 3,
          totalAmount: 103
        })
      });
    });

    // Verify navigation to success page
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/payment/success?transactionId=txn_123456');
    });
  });

  test('Should handle transfer failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Insufficient funds' })
    });

    render(<SendMoney />);
    
    const recipientInput = screen.getByLabelText(/Recipient Email/i);
    const amountInput = screen.getByLabelText(/Amount/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    // Fill form with valid data
    await user.type(recipientInput, 'test@example.com');
    await user.type(amountInput, '100');

    // Wait for button to be enabled
    await waitFor(() => {
      expect(sendButton).toBeEnabled();
    });

    // Click send button
    await user.click(sendButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Insufficient funds/i)).toBeInTheDocument();
    });

    // Verify no navigation occurred
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('Should handle network errors during transfer', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<SendMoney />);
    
    const recipientInput = screen.getByLabelText(/Recipient Email/i);
    const amountInput = screen.getByLabelText(/Amount/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    // Fill form with valid data
    await user.type(recipientInput, 'test@example.com');
    await user.type(amountInput, '100');

    // Wait for button to be enabled
    await waitFor(() => {
      expect(sendButton).toBeEnabled();
    });

    // Click send button
    await user.click(sendButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Transaction failed. Please try again./i)).toBeInTheDocument();
    });

    // Verify no navigation occurred
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('Should update fee calculator when amount changes', async () => {
    render(<SendMoney />);
    
    const amountInput = screen.getByLabelText(/Amount/i);

    // Type amount
    await user.type(amountInput, '100');

    // Check fee calculation
    await waitFor(() => {
      expect(screen.getByText('$3.00')).toBeInTheDocument(); // Transfer Fee
      expect(screen.getByText('$103.00')).toBeInTheDocument(); // Total Amount
    });

    // Change amount
    await user.clear(amountInput);
    await user.type(amountInput, '200');

    // Check updated fee calculation
    await waitFor(() => {
      expect(screen.getByText('$6.00')).toBeInTheDocument(); // Transfer Fee
      expect(screen.getByText('$206.00')).toBeInTheDocument(); // Total Amount
    });
  });

  test('Should validate amount limits', async () => {
    render(<SendMoney />);
    
    const amountInput = screen.getByLabelText(/Amount/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    // Test minimum amount
    await user.type(amountInput, '5');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText(/Minimum amount is \$10/i)).toBeInTheDocument();
      expect(sendButton).toBeDisabled();
    });

    // Clear and test maximum amount
    await user.clear(amountInput);
    await user.type(amountInput, '60000');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText(/Maximum amount is \$50,000/i)).toBeInTheDocument();
      expect(sendButton).toBeDisabled();
    });
  });

  test('Should clear validation errors when user starts typing', async () => {
    render(<SendMoney />);
    
    const recipientInput = screen.getByLabelText(/Recipient Email/i);
    const amountInput = screen.getByLabelText(/Amount/i);

    // Trigger validation errors
    await user.click(recipientInput);
    await user.tab();
    await user.click(amountInput);
    await user.tab();

    // Verify errors are shown
    expect(screen.getByText(/Recipient email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Amount is required/i)).toBeInTheDocument();

    // Start typing in recipient field
    await user.type(recipientInput, 'test@example.com');

    // Verify recipient error is cleared
    await waitFor(() => {
      expect(screen.queryByText(/Recipient email is required/i)).not.toBeInTheDocument();
    });

    // Start typing in amount field
    await user.type(amountInput, '100');

    // Verify amount error is cleared
    await waitFor(() => {
      expect(screen.queryByText(/Amount is required/i)).not.toBeInTheDocument();
    });
  });

  test('Should handle currency selection', async () => {
    render(<SendMoney />);
    
    const currencySelect = screen.getByLabelText(/Currency/i);
    const amountInput = screen.getByLabelText(/Amount/i);

    // Type amount to see currency symbol
    await user.type(amountInput, '100');

    // Change currency to EUR
    await user.selectOptions(currencySelect, 'EUR');

    // Verify currency symbol changes in fee calculator
    await waitFor(() => {
      expect(screen.getByText('€100.00')).toBeInTheDocument();
    });
  });

  test('Should show loading state during transfer', async () => {
    // Mock a delayed response
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    mockFetch.mockImplementationOnce(() => promise);

    render(<SendMoney />);
    
    const recipientInput = screen.getByLabelText(/Recipient Email/i);
    const amountInput = screen.getByLabelText(/Amount/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    // Fill form with valid data
    await user.type(recipientInput, 'test@example.com');
    await user.type(amountInput, '100');

    // Wait for button to be enabled
    await waitFor(() => {
      expect(sendButton).toBeEnabled();
    });

    // Click send button
    await user.click(sendButton);

    // Verify loading state
    await waitFor(() => {
      expect(sendButton).toHaveTextContent(/Processing.../i);
      expect(sendButton).toBeDisabled();
    });

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => ({ transactionId: 'txn_123456' })
    });
  });
}); 