// Custom Error Classes for PacheduConnect Mobile App

export enum ErrorCode {
  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  
  // Authentication Errors
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  BIOMETRIC_FAILED = 'BIOMETRIC_FAILED',
  
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_RECIPIENT = 'INVALID_RECIPIENT',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  
  // Business Logic Errors
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  KYC_REQUIRED = 'KYC_REQUIRED',
  KYC_PENDING = 'KYC_PENDING',
  KYC_REJECTED = 'KYC_REJECTED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server Errors
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
  
  // Client Errors
  INVALID_REQUEST = 'INVALID_REQUEST',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  
  // Storage Errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  STORAGE_FULL = 'STORAGE_FULL',
  
  // Performance Errors
  PERFORMANCE_ERROR = 'PERFORMANCE_ERROR',
  
  // Unknown Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  userMessage: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly retryable: boolean;
  public readonly userMessage: string;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = 'AppError';
    this.code = details.code;
    this.retryable = details.retryable;
    this.userMessage = details.userMessage;
    this.timestamp = details.timestamp;
    this.context = details.context;
  }

  static fromNetworkError(error: any): AppError {
    return new AppError({
      code: ErrorCode.NETWORK_ERROR,
      message: error.message || 'Network connection failed',
      retryable: true,
      userMessage: 'Please check your internet connection and try again',
      timestamp: new Date(),
      context: { originalError: error }
    });
  }

  static fromAuthError(error: any): AppError {
    return new AppError({
      code: ErrorCode.AUTHENTICATION_FAILED,
      message: error.message || 'Authentication failed',
      retryable: false,
      userMessage: 'Please log in again',
      timestamp: new Date(),
      context: { originalError: error }
    });
  }

  static fromValidationError(field: string, message: string): AppError {
    return new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message: `Validation failed for ${field}: ${message}`,
      retryable: false,
      userMessage: message,
      timestamp: new Date(),
      context: { field }
    });
  }

  static fromBusinessError(code: ErrorCode, message: string, userMessage: string): AppError {
    return new AppError({
      code,
      message,
      retryable: false,
      userMessage,
      timestamp: new Date()
    });
  }

  static fromServerError(error: any): AppError {
    return new AppError({
      code: ErrorCode.SERVER_ERROR,
      message: error.message || 'Server error occurred',
      retryable: true,
      userMessage: 'Something went wrong. Please try again later.',
      timestamp: new Date(),
      context: { originalError: error }
    });
  }
}

// Error Handler Class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handleError(error: AppError): void {
    // Log error
    this.logError(error);
    
    // Send to analytics/monitoring service
    this.reportError(error);
    
    // Handle specific error types
    this.handleSpecificError(error);
  }

  private logError(error: AppError): void {
    this.errorLog.push(error);
    console.error('AppError:', {
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      timestamp: error.timestamp,
      context: error.context
    });
  }

  private reportError(error: AppError): void {
    // In production, send to monitoring service (Sentry, etc.)
    if (__DEV__) {
      console.log('Error reported to monitoring service:', error);
    }
  }

  private handleSpecificError(error: AppError): void {
    switch (error.code) {
      case ErrorCode.TOKEN_EXPIRED:
        // Trigger re-authentication
        this.handleTokenExpired();
        break;
      case ErrorCode.KYC_REQUIRED:
        // Navigate to KYC screen
        this.handleKYCRequired();
        break;
      case ErrorCode.INSUFFICIENT_BALANCE:
        // Show balance top-up options
        this.handleInsufficientBalance();
        break;
      case ErrorCode.RATE_LIMIT_EXCEEDED:
        // Show rate limit message
        this.handleRateLimitExceeded();
        break;
    }
  }

  private handleTokenExpired(): void {
    // This would typically trigger a logout or token refresh
    console.log('Token expired - triggering re-authentication');
  }

  private handleKYCRequired(): void {
    // Navigate to KYC screen
    console.log('KYC required - navigating to KYC screen');
  }

  private handleInsufficientBalance(): void {
    // Show balance top-up options
    console.log('Insufficient balance - showing top-up options');
  }

  private handleRateLimitExceeded(): void {
    // Show rate limit message
    console.log('Rate limit exceeded - showing message');
  }

  getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }
}

// Error Messages for User Display
export const ErrorMessages = {
  [ErrorCode.NETWORK_ERROR]: 'Please check your internet connection and try again',
  [ErrorCode.CONNECTION_ERROR]: 'Connection lost. Please check your network and try again',
  [ErrorCode.TIMEOUT_ERROR]: 'Request timed out. Please try again',
  [ErrorCode.AUTHENTICATION_FAILED]: 'Please log in again',
  [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please log in again',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.BIOMETRIC_FAILED]: 'Biometric authentication failed. Please try again',
  [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again',
  [ErrorCode.INVALID_AMOUNT]: 'Please enter a valid amount',
  [ErrorCode.INVALID_RECIPIENT]: 'Please select a valid recipient',
  [ErrorCode.INSUFFICIENT_BALANCE]: 'Insufficient balance. Please top up your account',
  [ErrorCode.TRANSACTION_FAILED]: 'Transaction failed. Please try again',
  [ErrorCode.KYC_REQUIRED]: 'KYC verification required to continue',
  [ErrorCode.KYC_PENDING]: 'Your KYC verification is being processed',
  [ErrorCode.KYC_REJECTED]: 'KYC verification was rejected. Please contact support',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment',
  [ErrorCode.SERVER_ERROR]: 'Something went wrong. Please try again later',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ErrorCode.MAINTENANCE_MODE]: 'System maintenance in progress',
  [ErrorCode.INVALID_REQUEST]: 'Invalid request. Please try again',
  [ErrorCode.FORBIDDEN]: 'Access denied',
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.STORAGE_ERROR]: 'Storage error occurred',
  [ErrorCode.STORAGE_FULL]: 'Storage is full. Please free up space',
  [ErrorCode.PERFORMANCE_ERROR]: 'App is performing slowly. Please try again later or restart the app',
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred',
};

// Utility function to create user-friendly error messages
export function createUserFriendlyMessage(error: AppError): string {
  return error.userMessage || ErrorMessages[error.code as keyof typeof ErrorMessages] || ErrorMessages[ErrorCode.UNKNOWN_ERROR];
}

// Utility function to check if error is retryable
export function isRetryableError(error: AppError): boolean {
  return error.retryable;
}

// Utility function to get retry delay for retryable errors
export function getRetryDelay(error: AppError, attempt: number): number {
  if (!isRetryableError(error)) return 0;
  
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s
  return Math.min(1000 * Math.pow(2, attempt - 1), 16000);
} 