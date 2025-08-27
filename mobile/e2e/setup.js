// E2E Test Setup for PacheduConnect Mobile App

import { jest } from '@jest/globals';

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log during tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  osName: 'iOS',
  osInternalBuildId: 'test-device-id',
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock React Query
jest.mock('react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }) => children,
}));

// Mock Axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

// Mock React Native components
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    Linking: {
      openURL: jest.fn(),
    },
    Platform: {
      OS: 'ios',
      Version: '15.0',
    },
  };
});

// Mock React Native Safe Area Context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }),
}));

// Mock Linear Gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => children,
}));

// Mock Expo Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Test utilities
global.testUtils = {
  // Mock user data
  mockUser: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890',
    kycStatus: 'approved',
    balance: 1000,
  },

  // Mock transaction data
  mockTransaction: {
    id: 'test-transaction-id',
    type: 'send',
    amount: 100,
    currency: 'USD',
    recipientId: 'recipient-id',
    recipientName: 'John Doe',
    status: 'completed',
    fee: 3,
    reference: 'TXN123456',
    createdAt: new Date().toISOString(),
  },

  // Mock KYC data
  mockKYCStatus: {
    id: 'test-kyc-id',
    userId: 'test-user-id',
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
  },

  // Mock notification data
  mockNotification: {
    id: 'test-notification-id',
    type: 'transaction',
    title: 'Transaction Completed',
    message: 'Your transaction has been completed successfully',
    read: false,
    createdAt: new Date().toISOString(),
    priority: 'normal',
  },

  // Helper functions
  createMockApiResponse: (data, success = true) => ({
    data,
    success,
    message: success ? 'Success' : 'Error',
  }),

  createMockError: (code, message) => ({
    code,
    message,
    response: {
      status: 400,
      data: { message },
    },
  }),

  // Wait utility
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock API responses
  mockApiResponses: {
    auth: {
      login: {
        success: {
          user: global.testUtils.mockUser,
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
        },
        failure: {
          error: 'Invalid credentials',
        },
      },
      register: {
        success: {
          user: global.testUtils.mockUser,
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
        },
        failure: {
          error: 'Email already exists',
        },
      },
    },
    transactions: {
      create: {
        success: global.testUtils.mockTransaction,
        failure: {
          error: 'Insufficient balance',
        },
      },
      list: {
        success: {
          transactions: [global.testUtils.mockTransaction],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      },
    },
    kyc: {
      status: {
        success: global.testUtils.mockKYCStatus,
      },
      submit: {
        success: global.testUtils.mockKYCStatus,
      },
    },
    notifications: {
      list: {
        success: {
          notifications: [global.testUtils.mockNotification],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      },
    },
  },
};

// Global test environment setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset console mocks
  global.console.log.mockClear();
  global.console.error.mockClear();
  
  // Setup default mock implementations
  const { SecureStore } = require('expo-secure-store');
  SecureStore.getItemAsync.mockResolvedValue(null);
  SecureStore.setItemAsync.mockResolvedValue();
  SecureStore.deleteItemAsync.mockResolvedValue();
  
  const { LocalAuthentication } = require('expo-local-authentication');
  LocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
  LocalAuthentication.isEnrolledAsync.mockResolvedValue(true);
  LocalAuthentication.authenticateAsync.mockResolvedValue({ success: true });
  
  const NetInfo = require('@react-native-community/netinfo');
  NetInfo.fetch.mockResolvedValue({ isConnected: true });
});

afterEach(() => {
  // Cleanup after each test
  jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(30000);

// Export test utilities for use in tests
export { global.testUtils as testUtils }; 