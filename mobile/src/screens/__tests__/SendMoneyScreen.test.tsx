/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: SendMoneyScreen.test - test file for backend functionality
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import SendMoneyScreen from '../SendMoneyScreen';
import { QueryClient, QueryClientProvider } from 'react-query';

// Mock dependencies
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: {},
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        {children}
      </NavigationContainer>
    </QueryClientProvider>
  );
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui, { wrapper: AllTheProviders });
};

describe('SendMoneyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders all main components', () => {
      renderWithProviders(<SendMoneyScreen />);

      expect(screen.getByText('Send Money')).toBeTruthy();
      expect(screen.getByText('Recipient Details')).toBeTruthy();
      expect(screen.getByText('Amount & Currency')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter amount')).toBeTruthy();
      expect(screen.getByText('Continue')).toBeTruthy();
    });

    test('shows recipient selection initially', () => {
      renderWithProviders(<SendMoneyScreen />);

      expect(screen.getByText('Select Recipient')).toBeTruthy();
      expect(screen.getByText('+ Add New Recipient')).toBeTruthy();
    });

    test('displays currency selector', () => {
      renderWithProviders(<SendMoneyScreen />);

      expect(screen.getByTestId('currency-selector')).toBeTruthy();
      expect(screen.getByText('ZAR')).toBeTruthy(); // Default source currency
      expect(screen.getByText('USD')).toBeTruthy(); // Default target currency
    });
  });

  describe('Amount Input', () => {
    test('accepts valid amount input', async () => {
      renderWithProviders(<SendMoneyScreen />);

      const amountInput = screen.getByPlaceholderText('Enter amount');
      fireEvent.changeText(amountInput, '1000');

      expect(amountInput.props.value).toBe('1000');
    });

    test('validates minimum amount', async () => {
      renderWithProviders(<SendMoneyScreen />);

      const amountInput = screen.getByPlaceholderText('Enter amount');
      fireEvent.changeText(amountInput, '5'); // Below minimum

      const continueButton = screen.getByText('Continue');
      fireEvent.press(continueButton);

      await waitFor(() => {
        expect(screen.getByText(/minimum amount/i)).toBeTruthy();
      });
    });

    test('validates maximum amount', async () => {
      renderWithProviders(<SendMoneyScreen />);

      const amountInput = screen.getByPlaceholderText('Enter amount');
      fireEvent.changeText(amountInput, '100000'); // Above maximum

      const continueButton = screen.getByText('Continue');
      fireEvent.press(continueButton);

      await waitFor(() => {
        expect(screen.getByText(/maximum amount/i)).toBeTruthy();
      });
    });

    test('formats amount display correctly', async () => {
      renderWithProviders(<SendMoneyScreen />);

      const amountInput = screen.getByPlaceholderText('Enter amount');
      fireEvent.changeText(amountInput, '1234.56');

      expect(screen.getByText('R 1,234.56')).toBeTruthy();
    });
  });

  describe('Currency Conversion', () => {
    test('shows exchange rate when amount is entered', async () => {
      // Mock exchange rate API response
      const mockExchangeRate = { rate: 18.50, timestamp: Date.now() };
      
      renderWithProviders(<SendMoneyScreen />);

      const amountInput = screen.getByPlaceholderText('Enter amount');
      fireEvent.changeText(amountInput, '1000');

      await waitFor(() => {
        expect(screen.getByText(/exchange rate/i)).toBeTruthy();
        expect(screen.getByText('18.50')).toBeTruthy();
      });
    });

    test('calculates recipient amount correctly', async () => {
      renderWithProviders(<SendMoneyScreen />);

      const amountInput = screen.getByPlaceholderText('Enter amount');
      fireEvent.changeText(amountInput, '1000');

      await waitFor(() => {
        expect(screen.getByText('$54.05')).toBeTruthy(); // 1000 / 18.50
      });
    });

    test('allows currency pair switching', async () => {
      renderWithProviders(<SendMoneyScreen />);

      const currencySelector = screen.getByTestId('currency-selector');
      fireEvent.press(currencySelector);

      const gbpOption = screen.getByText('GBP');
      fireEvent.press(gbpOption);

      expect(screen.getByText('£')).toBeTruthy();
    });
  });

  describe('Recipient Selection', () => {
    test('shows saved recipients list', async () => {
      const mockRecipients = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
      ];

      renderWithProviders(<SendMoneyScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.getByText('Jane Smith')).toBeTruthy();
      });
    });

    test('allows selecting a recipient', async () => {
      renderWithProviders(<SendMoneyScreen />);

      await waitFor(() => {
        const recipient = screen.getByText('John Doe');
        fireEvent.press(recipient);
      });

      expect(screen.getByText('✓')).toBeTruthy(); // Check mark
    });

    test('navigates to add recipient screen', async () => {
      renderWithProviders(<SendMoneyScreen />);

      const addRecipientButton = screen.getByText('+ Add New Recipient');
      fireEvent.press(addRecipientButton);

      expect(mockNavigate).toHaveBeenCalledWith('AddRecipient');
    });
  });

  describe('Fee Calculation', () => {
    test('displays transfer fees', async () => {
      renderWithProviders(<SendMoneyScreen />);

      const amountInput = screen.getByPlaceholderText('Enter amount');
      fireEvent.changeText(amountInput, '1000');

      await waitFor(() => {
        expect(screen.getByText('Transfer Fee')).toBeTruthy();
        expect(screen.getByText('R 45.00')).toBeTruthy();
      });
    });

    test('shows fee breakdown', async () => {
      renderWithProviders(<SendMoneyScreen />);

      const amountInput = screen.getByPlaceholderText('Enter amount');
      fireEvent.changeText(amountInput, '1000');

      const feeBreakdown = screen.getByText('View Fee Details');
      fireEvent.press(feeBreakdown);

      await waitFor(() => {
        expect(screen.getByText('Service Fee')).toBeTruthy();
        expect(screen.getByText('Processing Fee')).toBeTruthy();
        expect(screen.getByText('Exchange Margin')).toBeTruthy();
      });
    });

    test('updates total amount with fees', async () => {
      renderWithProviders(<SendMoneyScreen />);

      const amountInput = screen.getByPlaceholderText('Enter amount');
      fireEvent.changeText(amountInput, '1000');

      await waitFor(() => {
        expect(screen.getByText('Total: R 1,045.00')).toBeTruthy();
      });
    });
  });

  describe('Form Validation', () => {
    test('requires recipient selection', async () => {
      renderWithProviders(<SendMoneyScreen />);

      const amountInput = screen.getByPlaceholderText('Enter amount');
      fireEvent.changeText(amountInput, '1000');

      const continueButton = screen.getByText('Continue');
      fireEvent.press(continueButton);

      await waitFor(() => {
        expect(screen.getByText(/select a recipient/i)).toBeTruthy();
      });
    });

    test('requires valid amount', async () => {
      renderWithProviders(<SendMoneyScreen />);

      // Select a recipient first
      await waitFor(() => {
        const recipient = screen.getByText('John Doe');
        fireEvent.press(recipient);
      });

      const continueButton = screen.getByText('Continue');
      fireEvent.press(continueButton);

      await waitFor(() => {
        expect(screen.getByText(/enter an amount/i)).toBeTruthy();
      });
    });

    test('validates sufficient balance', async () => {
      // Mock insufficient balance
      renderWithProviders(<SendMoneyScreen />);

      const amountInput = screen.getByPlaceholderText('Enter amount');
      fireEvent.changeText(amountInput, '50000'); // More than available balance

      await waitFor(() => {
        const recipient = screen.getByText('John Doe');
        fireEvent.press(recipient);
      });

      const continueButton = screen.getByText('Continue');
      fireEvent.press(continueButton);

      await waitFor(() => {
        expect(screen.getByText(/insufficient balance/i)).toBeTruthy();
      });
    });
  });

  describe('Navigation', () => {
    test('continues to payment screen with valid form', async () => {
      renderWithProviders(<SendMoneyScreen />);

      // Fill valid form
      const amountInput = screen.getByPlaceholderText('Enter amount');
      fireEvent.changeText(amountInput, '1000');

      await waitFor(() => {
        const recipient = screen.getByText('John Doe');
        fireEvent.press(recipient);
      });

      const continueButton = screen.getByText('Continue');
      fireEvent.press(continueButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Payment', {
          amount: 1000,
          currency: 'ZAR',
          targetCurrency: 'USD',
          recipient: expect.objectContaining({ name: 'John Doe' }),
          fee: expect.any(Number),
        });
      });
    });

    test('goes back when back button is pressed', () => {
      renderWithProviders(<SendMoneyScreen />);

      const backButton = screen.getByTestId('back-button');
      fireEvent.press(backButton);

      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('Real-time Updates', () => {
    test('updates exchange rates periodically', async () => {
      renderWithProviders(<SendMoneyScreen />);

      const amountInput = screen.getByPlaceholderText('Enter amount');
      fireEvent.changeText(amountInput, '1000');

      // Initial rate
      await waitFor(() => {
        expect(screen.getByText('18.50')).toBeTruthy();
      });

      // Mock rate update after 30 seconds
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(screen.getByText('18.52')).toBeTruthy(); // Updated rate
      });
    });

    test('handles network errors gracefully', async () => {
      // Mock network error
      renderWithProviders(<SendMoneyScreen />);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeTruthy();
        expect(screen.getByText('Retry')).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper accessibility labels', () => {
      renderWithProviders(<SendMoneyScreen />);

      expect(screen.getByLabelText('Enter transfer amount')).toBeTruthy();
      expect(screen.getByLabelText('Select currency')).toBeTruthy();
      expect(screen.getByLabelText('Continue to payment')).toBeTruthy();
    });

    test('supports screen reader navigation', () => {
      renderWithProviders(<SendMoneyScreen />);

      const elements = screen.getAllByRole('button');
      expect(elements.length).toBeGreaterThan(0);
      
      elements.forEach(element => {
        expect(element.props.accessible).toBeTruthy();
      });
    });
  });
});