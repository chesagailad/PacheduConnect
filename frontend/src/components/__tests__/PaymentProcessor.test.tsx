import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import PaymentProcessor from '../PaymentProcessor';

// Mock axios
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('PaymentProcessor Component', () => {
  const defaultProps = {
    amount: 1000,
    currency: 'ZAR',
    recipientEmail: 'recipient@example.com',
    description: 'Test payment',
  };

  const mockGateways = {
    stripe: {
      name: 'Stripe',
      description: 'Credit/Debit Card',
      currencies: ['USD', 'ZAR'],
      fees: { percentage: 2.9, fixed: 0.30 },
      supported: true,
    },
    paypal: {
      name: 'PayPal',
      description: 'PayPal Account',
      currencies: ['USD', 'EUR'],
      fees: { percentage: 3.4, fixed: 0.30 },
      supported: true,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({
      data: { gateways: mockGateways },
    });
  });

  describe('Rendering', () => {
    test('renders payment processor with basic elements', async () => {
      render(<PaymentProcessor {...defaultProps} />);

      expect(screen.getByText('Payment Methods')).toBeInTheDocument();
      expect(screen.getByText(`Amount: R${defaultProps.amount}`)).toBeInTheDocument();
      expect(screen.getByText(`Recipient: ${defaultProps.recipientEmail}`)).toBeInTheDocument();

      // Wait for gateways to load
      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });
    });

    test('shows loading state initially', () => {
      render(<PaymentProcessor {...defaultProps} />);
      
      expect(screen.getByText('Loading payment methods...')).toBeInTheDocument();
    });

    test('displays error when gateway loading fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));
      
      render(<PaymentProcessor {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/error loading payment methods/i)).toBeInTheDocument();
      });
    });
  });

  describe('Gateway Selection', () => {
    test('allows user to select a payment gateway', async () => {
      render(<PaymentProcessor {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      const stripeOption = screen.getByLabelText(/stripe/i);
      fireEvent.click(stripeOption);

      expect(stripeOption).toBeChecked();
    });

    test('shows only supported gateways for currency', async () => {
      render(<PaymentProcessor {...defaultProps} currency="EUR" />);

      await waitFor(() => {
        expect(screen.getByText('PayPal')).toBeInTheDocument();
        expect(screen.queryByText('Stripe')).not.toBeInTheDocument();
      });
    });

    test('displays gateway fees', async () => {
      render(<PaymentProcessor {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/2\.9%/)).toBeInTheDocument();
        expect(screen.getByText(/\$0\.30/)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    test('validates card number input', async () => {
      const user = userEvent.setup();
      render(<PaymentProcessor {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      // Select Stripe gateway
      fireEvent.click(screen.getByLabelText(/stripe/i));

      // Enter invalid card number
      const cardInput = screen.getByPlaceholderText(/card number/i);
      await user.type(cardInput, '1234');

      const submitButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid card number/i)).toBeInTheDocument();
      });
    });

    test('validates expiry date input', async () => {
      const user = userEvent.setup();
      render(<PaymentProcessor {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText(/stripe/i));

      const expiryInput = screen.getByPlaceholderText(/mm\/yy/i);
      await user.type(expiryInput, '13/25'); // Invalid month

      const submitButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid expiry date/i)).toBeInTheDocument();
      });
    });

    test('validates CVV input', async () => {
      const user = userEvent.setup();
      render(<PaymentProcessor {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText(/stripe/i));

      const cvvInput = screen.getByPlaceholderText(/cvv/i);
      await user.type(cvvInput, '12'); // Too short

      const submitButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid cvv/i)).toBeInTheDocument();
      });
    });
  });

  describe('Payment Processing', () => {
    test('processes successful payment', async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();
      
      mockedAxios.post.mockResolvedValue({
        data: {
          success: true,
          transactionId: 'txn_123',
          status: 'completed',
        },
      });

      render(<PaymentProcessor {...defaultProps} onSuccess={onSuccess} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      // Select gateway and fill form
      fireEvent.click(screen.getByLabelText(/stripe/i));
      
      await user.type(screen.getByPlaceholderText(/card number/i), '4111111111111111');
      await user.type(screen.getByPlaceholderText(/mm\/yy/i), '12/25');
      await user.type(screen.getByPlaceholderText(/cvv/i), '123');

      const submitButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith('/api/payments/process', expect.objectContaining({
          gateway: 'stripe',
          amount: defaultProps.amount,
          currency: defaultProps.currency,
          recipientEmail: defaultProps.recipientEmail,
        }));
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({
          transactionId: 'txn_123',
          status: 'completed',
        }));
      });
    });

    test('handles payment failure', async () => {
      const user = userEvent.setup();
      const onError = jest.fn();
      
      mockedAxios.post.mockRejectedValue({
        response: {
          data: { message: 'Card declined' },
        },
      });

      render(<PaymentProcessor {...defaultProps} onError={onError} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText(/stripe/i));
      
      await user.type(screen.getByPlaceholderText(/card number/i), '4000000000000002');
      await user.type(screen.getByPlaceholderText(/mm\/yy/i), '12/25');
      await user.type(screen.getByPlaceholderText(/cvv/i), '123');

      const submitButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Card declined');
      });
    });

    test('shows loading state during payment processing', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      mockedAxios.post.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: { success: true, transactionId: 'txn_123' }
        }), 1000))
      );

      render(<PaymentProcessor {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText(/stripe/i));
      
      await user.type(screen.getByPlaceholderText(/card number/i), '4111111111111111');
      await user.type(screen.getByPlaceholderText(/mm\/yy/i), '12/25');
      await user.type(screen.getByPlaceholderText(/cvv/i), '123');

      const submitButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/processing payment/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', async () => {
      render(<PaymentProcessor {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/payment amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/recipient email/i)).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /payment methods/i })).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<PaymentProcessor {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      // Tab through payment options
      await user.tab();
      expect(screen.getByLabelText(/stripe/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/paypal/i)).toHaveFocus();
    });
  });

  describe('Responsive Behavior', () => {
    test('adapts to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<PaymentProcessor {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      const container = screen.getByTestId('payment-processor');
      expect(container).toHaveClass('mobile-layout');
    });
  });
});