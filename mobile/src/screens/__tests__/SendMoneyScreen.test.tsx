/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: SendMoneyScreen.test - test file for SendMoneyScreen functionality
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import SendMoneyScreen from '../transfer/SendMoneyScreen';
import { Alert } from 'react-native';
import { offlineTransactionService } from '../../services/offline/offlineTransactionService';
jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

// Mock dependencies
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock offline service
jest.mock('../../services/offline/offlineTransactionService', () => ({
  offlineTransactionService: {
    createTransaction: jest.fn(),
    getTransactions: jest.fn(),
    calculateFees: jest.fn(),
  },
}));

// Mock offline hook
jest.mock('../../hooks/useOffline', () => ({
  useOffline: jest.fn(() => ({
    isOffline: false,
    lastSyncTime: new Date(),
  })),
}));

// Mock components
jest.mock('../../components/OfflineIndicator', () => ({
  OfflineIndicator: 'OfflineIndicator',
}));

describe('SendMoneyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders main components', () => {
      render(<SendMoneyScreen />);
      
      expect(screen.getAllByText('Send Money')).toBeTruthy();
      expect(screen.getByText('Select recipient')).toBeTruthy();
      expect(screen.getByText('Add New Recipient')).toBeTruthy();
      expect(screen.getByPlaceholderText('0.00')).toBeTruthy();
    });

    test('displays currency selector', () => {
      render(<SendMoneyScreen />);
      
      expect(screen.getByText('ZAR')).toBeTruthy(); // Default currency
    });
  });

  describe('Amount Input', () => {
    test('accepts valid amount input', () => {
      render(<SendMoneyScreen />);
      
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.changeText(amountInput, '1000');
      
      expect(amountInput.props.value).toBe('1000');
    });

    test('validates minimum amount', async () => {
      render(<SendMoneyScreen />);
      
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.changeText(amountInput, '0');
      
      const sendButtons = screen.getAllByText('Send Money');
      const sendButton = sendButtons[1]; // Get the button, not the header
      fireEvent.press(sendButton);
      
      // The component shows an Alert instead of UI text
      await waitFor(() => {
        expect(require('react-native').Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Please enter a valid amount'
        );
      });
    });
  });

  describe('Recipient Selection', () => {
    test('shows recipient selection when tapped', () => {
      render(<SendMoneyScreen />);
      
      const selectRecipientButton = screen.getByText('Select recipient');
      fireEvent.press(selectRecipientButton);
      
      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('Jane Smith')).toBeTruthy();
      expect(screen.getByText('Mike Johnson')).toBeTruthy();
    });

    test('allows selecting a recipient', () => {
      render(<SendMoneyScreen />);
      
      const selectRecipientButton = screen.getByText('Select recipient');
      fireEvent.press(selectRecipientButton);
      
      const johnDoeButton = screen.getByText('John Doe');
      fireEvent.press(johnDoeButton);
      
      expect(screen.getByText('John Doe')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    test('requires recipient selection', async () => {
      render(<SendMoneyScreen />);
      
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.changeText(amountInput, '100');
      
      const sendButtons = screen.getAllByText('Send Money');
      const sendButton = sendButtons[1]; // Get the button, not the header
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(require('react-native').Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Please select a recipient'
        );
      });
    });

    test('requires valid amount', async () => {
      render(<SendMoneyScreen />);
      
      const sendButtons = screen.getAllByText('Send Money');
      const sendButton = sendButtons[1]; // Get the button, not the header
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(require('react-native').Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Please enter a valid amount'
        );
      });
    });
  });

  describe('Navigation', () => {
    test('navigates to add recipient screen', () => {
      render(<SendMoneyScreen />);
      
      const addRecipientButton = screen.getByText('Add New Recipient');
      fireEvent.press(addRecipientButton);
      expect(mockNavigate).toHaveBeenCalled();
      
      expect(addRecipientButton).toBeTruthy();
    });
  });

  describe('Fee Calculation', () => {
    test('displays transfer fees', () => {
      render(<SendMoneyScreen />);
      
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.changeText(amountInput, '1000');
      
      expect(screen.getByText('Transfer Fee')).toBeTruthy();
      expect(screen.getByText('Total Amount')).toBeTruthy();
    });

    test('calculates fees correctly', () => {
      render(<SendMoneyScreen />);
      
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.changeText(amountInput, '1000');
      
      // 3% of 1000 = 30, but minimum is 0.30
      expect(screen.getByText('ZAR 30.00')).toBeTruthy();
      expect(screen.getByText('ZAR 1030.00')).toBeTruthy();
    });
  });

  describe('Success Flow', () => {
    test('handles successful transaction', async () => {
      render(<SendMoneyScreen />);
      
      // Select recipient
      const selectRecipientButton = screen.getByText('Select recipient');
      fireEvent.press(selectRecipientButton);
      
      const johnDoeButton = screen.getByText('John Doe');
      fireEvent.press(johnDoeButton);
      
      // Enter amount
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.changeText(amountInput, '100');
      
      // Submit
      const sendButtons = screen.getAllByText('Send Money');
      const sendButton = sendButtons[1]; // Get the button, not the header
      fireEvent.press(sendButton);
      
      // Wait for the success alert
      await waitFor(() => {
        expect(require('react-native').Alert.alert).toHaveBeenCalledWith(
          'Success',
          'Successfully sent ZAR 100 to John Doe',
          expect.any(Array)
        );
      }, { timeout: 3000 });
    });
  });
});

describe('Fee Calculation - Edge Cases', () => {
  test('applies minimum fee of ZAR 0.30 for small amounts', () => {
    render(<SendMoneyScreen />);
    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.changeText(amountInput, '1');

    // Minimum fee should apply (>= 0.30)
    expect(screen.getByText('ZAR 0.30')).toBeTruthy();
    expect(screen.getByText('ZAR 1.30')).toBeTruthy();
  });

  test('rounds fee to 2 decimals for fractional amounts (99.99 → fee 3.00, total 102.99)', () => {
    render(<SendMoneyScreen />);
    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.changeText(amountInput, '99.99');

    // 3% of 99.99 = 2.9997 → rounds to 3.00
    expect(screen.getByText('ZAR 3.00')).toBeTruthy();
    expect(screen.getByText('ZAR 102.99')).toBeTruthy();
  });
});

describe('Amount Input - Validation', () => {
  test('rejects non-numeric input and alerts error', async () => {
    render(<SendMoneyScreen />);

    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.changeText(amountInput, 'abc'); // invalid characters

    const sendButtons = screen.getAllByText('Send Money');
    const sendButton = sendButtons[1];
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Please enter a valid amount'
      );
    });
  });
});

describe('Recipient Selection - Update', () => {
  test('allows changing the selected recipient', () => {
    render(<SendMoneyScreen />);

    fireEvent.press(screen.getByText('Select recipient'));
    fireEvent.press(screen.getByText('John Doe'));
    expect(screen.getByText('John Doe')).toBeTruthy();

    // Re-open and choose a different recipient
    fireEvent.press(screen.getByText('Select recipient'));
    fireEvent.press(screen.getByText('Jane Smith'));
    expect(screen.getByText('Jane Smith')).toBeTruthy();
  });
});

describe('Offline Mode', () => {
  test('uses offline transaction service when offline and shows an alert', async () => {
    const mockedUseOffline = require('../../hooks/useOffline').useOffline as jest.Mock;
    mockedUseOffline.mockReturnValue({
      isOffline: true,
      lastSyncTime: new Date('2024-01-01'),
    });

    // Arrange: successful offline save
    (offlineTransactionService.createTransaction as jest.Mock).mockResolvedValueOnce({ id: 'tx1' });

    render(<SendMoneyScreen />);

    // Fill out form and submit
    fireEvent.press(screen.getByText('Select recipient'));
    fireEvent.press(screen.getByText('John Doe'));
    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.changeText(amountInput, '50');

    const sendButton = screen.getAllByText('Send Money')[1];
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(offlineTransactionService.createTransaction).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalled(); // exact success message may vary
    });
  });

  test('surfaces an error when offline transaction save fails', async () => {
    const mockedUseOffline = require('../../hooks/useOffline').useOffline as jest.Mock;
    mockedUseOffline.mockReturnValue({
      isOffline: true,
      lastSyncTime: new Date('2024-01-01'),
    });

    (offlineTransactionService.createTransaction as jest.Mock).mockRejectedValueOnce(new Error('Disk full'));

    render(<SendMoneyScreen />);

    fireEvent.press(screen.getByText('Select recipient'));
    fireEvent.press(screen.getByText('John Doe'));
    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.changeText(amountInput, '50');

    const sendButton = screen.getAllByText('Send Money')[1];
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
    });
  });
});