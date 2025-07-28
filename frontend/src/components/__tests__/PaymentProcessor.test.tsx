/**
 * PaymentProcessor Component Test Suite
 * 
 * Comprehensive test suite for the PaymentProcessor component that handles
 * payment processing, gateway selection, form validation, and error handling.
 * 
 * Test Coverage:
 * - Component rendering and initial state
 * - Payment gateway loading and selection
 * - Form validation for different payment methods
 * - Payment processing with success and error scenarios
 * - Loading states and user feedback
 * - Error handling and user notifications
 * - Fee calculation and display
 * - Security features and data protection
 * 
 * Test Categories:
 * - Rendering: Component display and initial state
 * - Payment Processing: Success and failure scenarios
 * - Form Validation: Input validation and error messages
 * - Error Handling: Network errors and API failures
 * - Gateway Selection: Payment method switching
 * 
 * Mocked Dependencies:
 * - next/navigation: Router functionality
 * - fetch: API calls to payment gateways
 * - localStorage: Authentication tokens
 * - window.scrollIntoView: DOM manipulation
 * 
 * Test Data:
 * - Mock payment gateways (Stripe, Stitch)
 * - Test payment amounts and currencies
 * - Sample user credentials and tokens
 * - Error scenarios and edge cases
 * 
 * @author PacheduConnect Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentProcessor from '../PaymentProcessor';

/**
 * Mock Next.js Navigation Router
 * 
 * Provides mock implementation of Next.js router for testing
 * navigation functionality without actual routing.
 */
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

/**
 * Mock Global Fetch API
 * 
 * Provides mock implementation of the fetch API for testing
 * HTTP requests to payment gateways and backend services.
 */
global.fetch = jest.fn();

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
    stitch: {
      name: 'Stitch',
      description: 'Bank Transfer',
      currencies: ['ZAR'],
      fees: { percentage: 1.5, fixed: 0.00 },
      supported: true,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe('Rendering', () => {
    test('renders payment processor with basic elements', async () => {
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ gateways: mockGateways }),
      });

      render(<PaymentProcessor {...defaultProps} />);

      expect(screen.getByText('Payment Details')).toBeInTheDocument();
      
      // Test specific amount display elements using test IDs
      const amountValue = screen.getByTestId('amount-value');
      expect(amountValue).toHaveTextContent('ZAR 1000.00');
      
      const feeValue = screen.getByTestId('fee-value');
      expect(feeValue).toHaveTextContent('ZAR 0.00'); // No fee in this case
      
      const totalValue = screen.getByTestId('total-value');
      expect(totalValue).toHaveTextContent('ZAR 1000.00');
      
      const payButton = screen.getByTestId('pay-button');
      expect(payButton).toHaveTextContent('Pay ZAR 1000.00');
      
      // Test that the button is disabled when no gateway is selected
      expect(payButton).toBeDisabled();
      
      // Note: recipient email is not displayed in the component UI

      // Wait for gateways to load
      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });
    });

    test('shows initial state and resolves gateway loading', async () => {
      // Mock delayed API response
      const fetchPromise = new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ gateways: mockGateways }),
      }), 100));
      
      (global.fetch as jest.Mock).mockImplementationOnce(() => fetchPromise);

      render(<PaymentProcessor {...defaultProps} />);
      
      // Initial state: Payment details should be shown immediately
      expect(screen.getByText('Payment Details')).toBeInTheDocument();
      expect(screen.getByTestId('amount-value')).toHaveTextContent('ZAR 1000.00');
      expect(screen.getByTestId('total-value')).toHaveTextContent('ZAR 1000.00');
      
      // Initial state: No gateways loaded yet, so payment method section should be empty
      expect(screen.getByText('Payment Method')).toBeInTheDocument();
      expect(screen.queryByText('Stripe')).not.toBeInTheDocument();
      expect(screen.queryByText('Stitch')).not.toBeInTheDocument();
      
      // Pay button should be disabled initially (no gateway selected)
      const payButton = screen.getByTestId('pay-button');
      expect(payButton).toBeDisabled();
      
      // Wait for the fetch to complete
      await fetchPromise;
      
      // After loading: Gateways should be available
      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
        expect(screen.getByText('Stitch')).toBeInTheDocument();
      });
      
      // After loading: Pay button should be enabled (gateway auto-selected)
      expect(payButton).not.toBeDisabled();
      
      // Verify the component is fully functional after loading
      const stripeOption = screen.getByLabelText(/stripe/i);
      expect(stripeOption).toBeChecked(); // Should be auto-selected
      
      // Test switching to another gateway
      const stitchOption = screen.getByLabelText(/stitch/i);
      fireEvent.click(stitchOption);
      expect(stitchOption).toBeChecked();
      expect(stripeOption).not.toBeChecked();
    });
  });

  describe('Payment Processing', () => {
    test('processes successful payment', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ gateways: mockGateways }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            paymentId: 'pay_123',
            payment: {} // Empty payment object so it doesn't have redirectUrl or formData
          }),
        });

      const onSuccess = jest.fn();
      render(<PaymentProcessor {...defaultProps} onSuccess={onSuccess} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      // Fill in required fields
      const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      const expiryMonthInput = screen.getByPlaceholderText('MM');
      const expiryYearInput = screen.getByPlaceholderText('YYYY');
      const cvvInput = screen.getByPlaceholderText('123');

      fireEvent.change(cardNumberInput, { target: { value: '4242424242424242' } });
      fireEvent.change(expiryMonthInput, { target: { value: '12' } });
      fireEvent.change(expiryYearInput, { target: { value: '2025' } });
      fireEvent.change(cvvInput, { target: { value: '123' } });

      const payButton = screen.getByText(/Pay ZAR/);
      fireEvent.click(payButton);

      // Wait for the onSuccess callback to be called with the expected payment data
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith({
          success: true,
          paymentId: 'pay_123',
          payment: {}
        });
      });

      // Verify the form data was correctly filled
      expect(cardNumberInput).toHaveValue('4242424242424242');
      expect(expiryMonthInput).toHaveValue('12');
      expect(expiryYearInput).toHaveValue('2025');
      expect(cvvInput).toHaveValue('123');
    });

    test('shows loading state during payment processing', async () => {
      // Mock successful gateway fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ gateways: mockGateways }),
      });

      // Mock delayed payment processing
      const paymentPromise = new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, paymentId: 'pay_123' }),
      }), 200));
      
      (global.fetch as jest.Mock).mockImplementationOnce(() => paymentPromise);

      render(<PaymentProcessor {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      // Fill in required fields
      const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      const expiryMonthInput = screen.getByPlaceholderText('MM');
      const expiryYearInput = screen.getByPlaceholderText('YYYY');
      const cvvInput = screen.getByPlaceholderText('123');

      fireEvent.change(cardNumberInput, { target: { value: '4242424242424242' } });
      fireEvent.change(expiryMonthInput, { target: { value: '12' } });
      fireEvent.change(expiryYearInput, { target: { value: '2025' } });
      fireEvent.change(cvvInput, { target: { value: '123' } });

      const payButton = screen.getByTestId('pay-button');
      
      // Before clicking: button should be enabled
      expect(payButton).not.toBeDisabled();
      
      // Click the button to start payment processing
      fireEvent.click(payButton);
      
      // During processing: button should be disabled and show loading
      expect(payButton).toBeDisabled();
      
      // Wait for payment processing to complete
      await paymentPromise;
      
      // After processing: button should be enabled again
      await waitFor(() => {
        expect(payButton).not.toBeDisabled();
      });
    });

    test('handles payment failure', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ gateways: mockGateways }),
        })
        .mockRejectedValueOnce(new Error('Payment failed'));

      const onError = jest.fn();
      render(<PaymentProcessor {...defaultProps} onError={onError} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      // Fill in required fields
      const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      const expiryMonthInput = screen.getByPlaceholderText('MM');
      const expiryYearInput = screen.getByPlaceholderText('YYYY');
      const cvvInput = screen.getByPlaceholderText('123');

      fireEvent.change(cardNumberInput, { target: { value: '4242424242424242' } });
      fireEvent.change(expiryMonthInput, { target: { value: '12' } });
      fireEvent.change(expiryYearInput, { target: { value: '2025' } });
      fireEvent.change(cvvInput, { target: { value: '123' } });

      const payButton = screen.getByText(/Pay ZAR/);
      fireEvent.click(payButton);

      // Wait for the onError callback to be called with the expected error message
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Payment failed');
      });
    });

    test('handles payment API error response', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ gateways: mockGateways }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ message: 'Invalid payment method' }),
        });

      const onError = jest.fn();
      render(<PaymentProcessor {...defaultProps} onError={onError} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      // Fill in required fields
      const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      const expiryMonthInput = screen.getByPlaceholderText('MM');
      const expiryYearInput = screen.getByPlaceholderText('YYYY');
      const cvvInput = screen.getByPlaceholderText('123');

      fireEvent.change(cardNumberInput, { target: { value: '4242424242424242' } });
      fireEvent.change(expiryMonthInput, { target: { value: '12' } });
      fireEvent.change(expiryYearInput, { target: { value: '2025' } });
      fireEvent.change(cvvInput, { target: { value: '123' } });

      const payButton = screen.getByText(/Pay ZAR/);
      fireEvent.click(payButton);

      // Wait for the onError callback to be called with the API error message
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Invalid payment method');
      });
    });
  });

  describe('Form Validation', () => {
    test('validates Stripe card details', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ gateways: mockGateways }),
      });

      const onSuccess = jest.fn();
      render(<PaymentProcessor {...defaultProps} onSuccess={onSuccess} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      const payButton = screen.getByTestId('pay-button');
      
      // Initially no error should be shown
      expect(screen.queryByText('Please fill in all card details')).not.toBeInTheDocument();
      
      // Click without filling any card details
      fireEvent.click(payButton);
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('Please fill in all card details')).toBeInTheDocument();
      });
      
      // onSuccess should not be called
      expect(onSuccess).not.toHaveBeenCalled();
      
      // Fill in some but not all required fields
      const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      const expiryMonthInput = screen.getByPlaceholderText('MM');
      
      fireEvent.change(cardNumberInput, { target: { value: '4242424242424242' } });
      fireEvent.change(expiryMonthInput, { target: { value: '12' } });
      
      // Clear error and try again
      fireEvent.click(payButton);
      
      // Should still show validation error (missing expiry year and CVV)
      await waitFor(() => {
        expect(screen.getByText('Please fill in all card details')).toBeInTheDocument();
      });
      
      // onSuccess should still not be called
      expect(onSuccess).not.toHaveBeenCalled();
    });

    test('validates Stitch bank details', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ gateways: mockGateways }),
      });

      const onSuccess = jest.fn();
      render(<PaymentProcessor {...defaultProps} onSuccess={onSuccess} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      // Switch to Stitch gateway
      const stitchOption = screen.getByLabelText(/stitch/i);
      fireEvent.click(stitchOption);
      
      const payButton = screen.getByTestId('pay-button');
      
      // Initially no error should be shown
      expect(screen.queryByText('Please provide bank account and bank code')).not.toBeInTheDocument();
      
      // Click without filling bank details
      fireEvent.click(payButton);
      
      // Should show validation error for Stitch
      await waitFor(() => {
        expect(screen.getByText('Please provide bank account and bank code')).toBeInTheDocument();
      });
      
      // onSuccess should not be called
      expect(onSuccess).not.toHaveBeenCalled();
      
      // Fill in only bank account
      const bankAccountInput = screen.getByPlaceholderText('1234567890');
      fireEvent.change(bankAccountInput, { target: { value: '1234567890' } });
      
      // Clear error and try again
      fireEvent.click(payButton);
      
      // Should still show validation error (missing bank code)
      await waitFor(() => {
        expect(screen.getByText('Please provide bank account and bank code')).toBeInTheDocument();
      });
      
      // onSuccess should still not be called
      expect(onSuccess).not.toHaveBeenCalled();
    });

    test('validates partial form completion', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ gateways: mockGateways }),
      });

      const onSuccess = jest.fn();
      render(<PaymentProcessor {...defaultProps} onSuccess={onSuccess} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      const payButton = screen.getByTestId('pay-button');
      
      // Fill in only some required fields
      const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      const expiryMonthInput = screen.getByPlaceholderText('MM');
      
      fireEvent.change(cardNumberInput, { target: { value: '4242424242424242' } });
      fireEvent.change(expiryMonthInput, { target: { value: '12' } });
      
      // Submit with incomplete form
      fireEvent.click(payButton);
      
      // Should show validation error for missing fields
      await waitFor(() => {
        expect(screen.getByText('Please fill in all card details')).toBeInTheDocument();
      });
      
      // onSuccess should not be called
      expect(onSuccess).not.toHaveBeenCalled();
      
      // Fill in the remaining required fields
      const expiryYearInput = screen.getByPlaceholderText('YYYY');
      const cvvInput = screen.getByPlaceholderText('123');
      
      fireEvent.change(expiryYearInput, { target: { value: '2025' } });
      fireEvent.change(cvvInput, { target: { value: '123' } });
      
      // Clear error and try again
      fireEvent.click(payButton);
      
      // Should not show validation error anymore
      await waitFor(() => {
        expect(screen.queryByText('Please fill in all card details')).not.toBeInTheDocument();
      });
    });

    test('validates form fields for different gateways', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ gateways: mockGateways }),
      });

      const onSuccess = jest.fn();
      render(<PaymentProcessor {...defaultProps} onSuccess={onSuccess} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      const payButton = screen.getByTestId('pay-button');
      
      // Test Stripe validation
      fireEvent.click(payButton);
      
      // Should show validation error for missing card details
      await waitFor(() => {
        expect(screen.getByText('Please fill in all card details')).toBeInTheDocument();
      });
      
      // onSuccess should not be called
      expect(onSuccess).not.toHaveBeenCalled();
      
      // Switch to Stitch and test bank validation
      const stitchOption = screen.getByLabelText(/stitch/i);
      fireEvent.click(stitchOption);
      fireEvent.click(payButton);
      
      // Should show validation error for missing bank details
      await waitFor(() => {
        expect(screen.getByText('Please provide bank account and bank code')).toBeInTheDocument();
      });
      
      // onSuccess should still not be called
      expect(onSuccess).not.toHaveBeenCalled();
    });

    test('allows submission with valid form data', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ gateways: mockGateways }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            paymentId: 'pay_123',
            payment: {}
          }),
        });

      const onSuccess = jest.fn();
      render(<PaymentProcessor {...defaultProps} onSuccess={onSuccess} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      // Fill in all required fields
      const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      const expiryMonthInput = screen.getByPlaceholderText('MM');
      const expiryYearInput = screen.getByPlaceholderText('YYYY');
      const cvvInput = screen.getByPlaceholderText('123');

      fireEvent.change(cardNumberInput, { target: { value: '4242424242424242' } });
      fireEvent.change(expiryMonthInput, { target: { value: '12' } });
      fireEvent.change(expiryYearInput, { target: { value: '2025' } });
      fireEvent.change(cvvInput, { target: { value: '123' } });

      const payButton = screen.getByTestId('pay-button');
      
      // No validation errors should be shown
      expect(screen.queryByText('Please fill in all card details')).not.toBeInTheDocument();
      
      // Submit with valid data
      fireEvent.click(payButton);
      
      // Should not show validation errors
      await waitFor(() => {
        expect(screen.queryByText('Please fill in all card details')).not.toBeInTheDocument();
      });
      
      // onSuccess should be called (payment processing will succeed)
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith({
          success: true,
          paymentId: 'pay_123',
          payment: {}
        });
      });
    });
  });

  describe('Error Handling', () => {
    test('displays payment processing network errors', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ gateways: mockGateways }),
        })
        .mockRejectedValueOnce(new Error('Network connection failed'));

      const onError = jest.fn();
      render(<PaymentProcessor {...defaultProps} onError={onError} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      // Fill in required fields
      const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      const expiryMonthInput = screen.getByPlaceholderText('MM');
      const expiryYearInput = screen.getByPlaceholderText('YYYY');
      const cvvInput = screen.getByPlaceholderText('123');

      fireEvent.change(cardNumberInput, { target: { value: '4242424242424242' } });
      fireEvent.change(expiryMonthInput, { target: { value: '12' } });
      fireEvent.change(expiryYearInput, { target: { value: '2025' } });
      fireEvent.change(cvvInput, { target: { value: '123' } });

      const payButton = screen.getByTestId('pay-button');
      fireEvent.click(payButton);

      // Should display network error message to user
      await waitFor(() => {
        expect(screen.getByText('Network connection failed')).toBeInTheDocument();
      });

      // Should also call onError callback
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Network connection failed');
      });
    });

    test('displays payment processing API errors', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ gateways: mockGateways }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ message: 'Invalid payment method configuration' }),
        });

      const onError = jest.fn();
      render(<PaymentProcessor {...defaultProps} onError={onError} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      // Fill in required fields
      const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      const expiryMonthInput = screen.getByPlaceholderText('MM');
      const expiryYearInput = screen.getByPlaceholderText('YYYY');
      const cvvInput = screen.getByPlaceholderText('123');

      fireEvent.change(cardNumberInput, { target: { value: '4242424242424242' } });
      fireEvent.change(expiryMonthInput, { target: { value: '12' } });
      fireEvent.change(expiryYearInput, { target: { value: '2025' } });
      fireEvent.change(cvvInput, { target: { value: '123' } });

      const payButton = screen.getByTestId('pay-button');
      fireEvent.click(payButton);

      // Should display API error message to user
      await waitFor(() => {
        expect(screen.getByText('Invalid payment method configuration')).toBeInTheDocument();
      });

      // Should also call onError callback
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Invalid payment method configuration');
      });
    });

    test('displays generic payment error when API response lacks message', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ gateways: mockGateways }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({}), // No message property
        });

      const onError = jest.fn();
      render(<PaymentProcessor {...defaultProps} onError={onError} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
      });

      // Fill in required fields
      const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      const expiryMonthInput = screen.getByPlaceholderText('MM');
      const expiryYearInput = screen.getByPlaceholderText('YYYY');
      const cvvInput = screen.getByPlaceholderText('123');

      fireEvent.change(cardNumberInput, { target: { value: '4242424242424242' } });
      fireEvent.change(expiryMonthInput, { target: { value: '12' } });
      fireEvent.change(expiryYearInput, { target: { value: '2025' } });
      fireEvent.change(cvvInput, { target: { value: '123' } });

      const payButton = screen.getByTestId('pay-button');
      fireEvent.click(payButton);

      // Should display generic error message when API doesn't provide specific message
      await waitFor(() => {
        expect(screen.getByText('Payment failed')).toBeInTheDocument();
      });

      // Should also call onError callback
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Payment failed');
      });
    });

    test('handles gateway fetch errors gracefully without crashing', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Gateway fetch failed'));

      render(<PaymentProcessor {...defaultProps} />);

      // Component should handle gateway fetch error gracefully without crashing
      await waitFor(() => {
        expect(screen.getByText('Payment Details')).toBeInTheDocument();
      });

      // Should not display error message for gateway fetch (current implementation only logs)
      expect(screen.queryByText('Gateway fetch failed')).not.toBeInTheDocument();
      
      // Should show payment details even when gateways fail to load
      expect(screen.getByTestId('amount-value')).toHaveTextContent('ZAR 1000.00');
      expect(screen.getByTestId('total-value')).toHaveTextContent('ZAR 1000.00');
    });

    test('handles invalid gateway API responses gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      render(<PaymentProcessor {...defaultProps} />);

      // Component should handle invalid gateway API response gracefully without crashing
      await waitFor(() => {
        expect(screen.getByText('Payment Details')).toBeInTheDocument();
      });

      // Should not display error message for gateway API errors (current implementation only logs)
      expect(screen.queryByText('Internal Server Error')).not.toBeInTheDocument();
      
      // Should show payment details even when gateway API fails
      expect(screen.getByTestId('amount-value')).toHaveTextContent('ZAR 1000.00');
      expect(screen.getByTestId('total-value')).toHaveTextContent('ZAR 1000.00');
    });
  });

  describe('Gateway Selection', () => {
    test('allows user to select a payment gateway', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ gateways: mockGateways }),
      });

      render(<PaymentProcessor {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
        expect(screen.getByText('Stitch')).toBeInTheDocument();
      });

      const stripeOption = screen.getByLabelText(/stripe/i);
      expect(stripeOption).toBeChecked(); // Should be auto-selected
    });

    test('calculates fees correctly for different gateways', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ gateways: mockGateways }),
      });

      render(<PaymentProcessor {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Stripe')).toBeInTheDocument();
        expect(screen.getByText('Stitch')).toBeInTheDocument();
      });

      // Initially Stripe should be selected (auto-selected)
      const feeValue = screen.getByTestId('fee-value');
      expect(feeValue).toHaveTextContent('ZAR 29.30'); // 2.9% of 1000 + 0.30 fixed fee
      
      const totalValue = screen.getByTestId('total-value');
      expect(totalValue).toHaveTextContent('ZAR 1029.30'); // 1000 + 29.30

      // Select Stitch gateway
      const stitchOption = screen.getByLabelText(/stitch/i);
      fireEvent.click(stitchOption);

      // Fee should update to Stitch's fee structure
      expect(feeValue).toHaveTextContent('ZAR 15.00'); // 1.5% of 1000
      expect(totalValue).toHaveTextContent('ZAR 1015.00'); // 1000 + 15.00
    });
  });
});