/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: api - handles frontend functionality
 */

/**
 * Centralized API Configuration
 * Eliminates hardcoded URLs throughout the application
 */

const getApiBaseUrl = (): string => {
  // In production, use environment variable or default to relative path
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_API_URL || '/api';
  }
  
  // In development, use environment variable or default backend port
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 10000,
  
  ENDPOINTS: {
    // Authentication
    AUTH: '/api/auth',
    SEND_OTP: '/api/auth/send-otp',
    RESET_PASSWORD: '/api/auth/reset-password',
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    
    // User Management
    USER: '/api/user',
    PROFILE: '/api/user/profile',
    BALANCE: '/api/user/balance',
    
    // Transactions
    TRANSACTIONS: '/api/transactions',
    SEND_MONEY: '/api/send-money',
    TRANSACTION_STATS: '/api/transactions/stats',
    
    // Rates & Fees
    EXCHANGE_RATES: '/api/rates/exchange',
    FEE_CALCULATION: '/api/fees/calculate',
    
    // SMS & Notifications
    SMS: '/api/notifications/sms',
    NOTIFICATIONS: '/api/notifications',
    
    // Support
    SUPPORT: '/api/support',
    ESCALATE: '/api/support/escalate'
  }
} as const;

/**
 * Helper function to build full API URLs
 */
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Common request configuration
 */
export const REQUEST_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_CONFIG.TIMEOUT,
} as const;