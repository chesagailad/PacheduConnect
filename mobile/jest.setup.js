/**
 * Jest Setup File for PacheduConnect Mobile App
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Global test setup and mocks
 */

// Mock Expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1, 2])),
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'mock-token' })),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  brand: 'Apple',
  manufacturer: 'Apple',
  modelName: 'iPhone',
  modelId: 'iPhone14,2',
  designName: 'iPhone 14 Pro',
  productName: 'iPhone',
  deviceYearClass: 2022,
  totalMemory: 8589934592,
  supportedCpuArchitectures: ['arm64'],
  osName: 'iOS',
  osVersion: '16.0',
  osBuildId: '20A357',
  osInternalBuildId: '20A357',
  deviceName: 'iPhone',
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(() => Promise.resolve({
    type: 'success',
    uri: 'file://mock-document.pdf',
    name: 'mock-document.pdf',
    size: 1024,
  })),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({
    canceled: false,
    assets: [{
      uri: 'file://mock-image.jpg',
      width: 1920,
      height: 1080,
      type: 'image',
    }],
  })),
  launchCameraAsync: jest.fn(() => Promise.resolve({
    canceled: false,
    assets: [{
      uri: 'file://mock-photo.jpg',
      width: 1920,
      height: 1080,
      type: 'image',
    }],
  })),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
    reset: jest.fn(),
    setOptions: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
  useIsFocused: () => true,
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

// Mock React Native components
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.mock('react-native/Libraries/Components/Touchable/TouchableOpacity', () => 'TouchableOpacity');

jest.mock('react-native/Libraries/Components/Touchable/TouchableHighlight', () => 'TouchableHighlight');

// Mock React Native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    Settings: {
      get: jest.fn(),
      set: jest.fn(),
    },
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, type: 'wifi' })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock React Query
jest.mock('react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
  QueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
}));

// Mock Zustand
jest.mock('zustand', () => ({
  create: jest.fn(),
  subscribeWithSelector: jest.fn(),
}));

// Mock React Hook Form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(() => ({
    control: {},
    handleSubmit: jest.fn(),
    formState: { errors: {} },
    watch: jest.fn(),
    setValue: jest.fn(),
    getValues: jest.fn(),
    reset: jest.fn(),
  })),
  Controller: ({ render }) => render({ field: { onChange: jest.fn(), value: '' } }),
}));

// Mock Linear Gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
}));

// Mock Flash Message
jest.mock('react-native-flash-message', () => ({
  showMessage: jest.fn(),
  hideMessage: jest.fn(),
}));

// Mock Toast Message
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

// Mock Modal
jest.mock('react-native-modal', () => 'Modal');

// Mock Animatable
jest.mock('react-native-animatable', () => ({
  View: 'AnimatableView',
  Text: 'AnimatableText',
  TouchableOpacity: 'AnimatableTouchableOpacity',
}));

// Mock Phone Number Input
jest.mock('react-native-phone-number-input', () => 'PhoneNumberInput');

// Mock WebView
jest.mock('react-native-webview', () => 'WebView');

// Mock Keyboard Aware Scroll View
jest.mock('react-native-keyboard-aware-scroll-view', () => ({
  KeyboardAwareScrollView: 'KeyboardAwareScrollView',
}));

// Mock SVG
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Path: 'Path',
  Circle: 'Circle',
  Rect: 'Rect',
}));

// Mock Paper Components
jest.mock('react-native-paper', () => ({
  Button: 'Button',
  TextInput: 'TextInput',
  Card: 'Card',
  Title: 'Title',
  Paragraph: 'Paragraph',
  Avatar: 'Avatar',
  Badge: 'Badge',
  Chip: 'Chip',
  Divider: 'Divider',
  List: 'List',
  FAB: 'FAB',
  Portal: 'Portal',
  Modal: 'Modal',
  Provider: 'Provider',
}));

// Mock Elements Components
jest.mock('react-native-elements', () => ({
  Button: 'Button',
  Input: 'Input',
  Card: 'Card',
  Text: 'Text',
  Avatar: 'Avatar',
  Badge: 'Badge',
  Chip: 'Chip',
  Divider: 'Divider',
  ListItem: 'ListItem',
  FAB: 'FAB',
  Overlay: 'Overlay',
  ThemeProvider: 'ThemeProvider',
}));

// Global test utilities
global.testUtils = {
  mockUser: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    kycStatus: 'approved',
    balance: 1000,
  },
  mockTransaction: {
    id: 'txn-123',
    type: 'send',
    amount: 100,
    currency: 'USD',
    status: 'completed',
    recipientName: 'John Doe',
    createdAt: new Date().toISOString(),
  },
  mockRecipient: {
    id: 'recipient-123',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
  },
  mockKYCData: {
    status: 'pending',
    documents: [],
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      nationality: 'US',
    },
  },
  mockNetworkState: {
    isConnected: true,
    type: 'wifi',
    isInternetReachable: true,
  },
  mockOfflineData: {
    transactions: [],
    userData: null,
    kycData: null,
    settings: null,
    lastSyncTime: new Date().toISOString(),
    syncVersion: 1,
  },
};

// Performance monitoring for tests
global.performance = {
  now: () => Date.now(),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
};

// Memory monitoring for tests
global.memory = {
  usedJSHeapSize: 1000000,
  totalJSHeapSize: 2000000,
  jsHeapSizeLimit: 4000000,
};

// Console error suppression for expected errors in tests
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
     args[0].includes('Warning: An invalid form control') ||
     args[0].includes('Warning: Each child in a list should have a unique "key" prop'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Setup and teardown
global.beforeEach = (fn) => {
  if (typeof fn === 'function') {
    fn();
  }
  jest.clearAllMocks();
  jest.clearAllTimers();
};

global.afterEach = (fn) => {
  if (typeof fn === 'function') {
    fn();
  }
  jest.restoreAllMocks();
};

// Global test timeout
jest.setTimeout(30000);