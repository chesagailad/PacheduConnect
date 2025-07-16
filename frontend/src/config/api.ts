/**
 * Centralized API Configuration
 * Eliminates hardcoded URLs throughout the application
 */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
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