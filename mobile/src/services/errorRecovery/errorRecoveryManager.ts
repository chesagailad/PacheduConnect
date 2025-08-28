/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Error Recovery Manager with robust error handling and retry mechanisms
 */

import { AppError, ErrorCode } from '../../utils/errors';
import { EventEmitter } from 'events';

// Error Recovery Interfaces
export interface ErrorRecoveryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  enableExponentialBackoff: boolean;
  enableCircuitBreaker: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  enableGracefulDegradation: boolean;
  enableErrorReporting: boolean;
}

export interface RetryContext {
  attempt: number;
  maxRetries: number;
  delay: number;
  error: AppError;
  operation: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: Date;
  nextAttemptTime: Date;
  threshold: number;
  timeout: number;
}

export interface ErrorRecoveryResult {
  success: boolean;
  attempts: number;
  totalTime: number;
  finalError?: AppError;
  recovered: boolean;
  degraded: boolean;
  metadata: Record<string, any>;
}

export interface GracefulDegradation {
  enabled: boolean;
  fallbackData?: any;
  offlineMode: boolean;
  cachedData: boolean;
  userMessage: string;
}

// Error Recovery Manager Class
export class ErrorRecoveryManager extends EventEmitter {
  private static instance: ErrorRecoveryManager;
  private config: ErrorRecoveryConfig;
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private errorHistory: AppError[] = [];
  private maxErrorHistory: number = 100;

  private constructor() {
    super();
    this.config = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      enableExponentialBackoff: true,
      enableCircuitBreaker: true,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
      enableGracefulDegradation: true,
      enableErrorReporting: true,
    };
  }

  static getInstance(): ErrorRecoveryManager {
    if (!ErrorRecoveryManager.instance) {
      ErrorRecoveryManager.instance = new ErrorRecoveryManager();
    }
    return ErrorRecoveryManager.instance;
  }

  // Execute operation with automatic retry and error recovery
  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    operationName: string,
    options?: {
      maxRetries?: number;
      timeout?: number;
      fallback?: () => Promise<T>;
      metadata?: Record<string, any>;
    }
  ): Promise<ErrorRecoveryResult & { data?: T }> {
    const startTime = Date.now();
    const maxRetries = options?.maxRetries ?? this.config.maxRetries;
    let attempts = 0;
    let lastError: AppError | undefined;

    // Check circuit breaker
    if (this.config.enableCircuitBreaker && this.isCircuitBreakerOpen(operationName)) {
      const result = await this.handleCircuitBreakerFailure(operationName, options);
      return result;
    }

    while (attempts <= maxRetries) {
      try {
        attempts++;
        
        // Execute operation with timeout
        const data = await this.executeWithTimeout(operation, options?.timeout);
        
        // Success - reset circuit breaker
        this.resetCircuitBreaker(operationName);
        
        const totalTime = Date.now() - startTime;
        const result: ErrorRecoveryResult & { data?: T } = {
          success: true,
          attempts,
          totalTime,
          recovered: attempts > 1,
          degraded: false,
          data,
          metadata: {
            operation: operationName,
            ...options?.metadata
          }
        };

        this.emit('operationSuccess', result);
        return result;

      } catch (error) {
        lastError = this.normalizeError(error, operationName);
        
        // Record error
        this.recordError(lastError);
        
        // Check if operation should be retried
        if (!this.shouldRetry(lastError, attempts, maxRetries)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempts);
        
        // Emit retry event
        this.emit('operationRetry', {
          attempt: attempts,
          maxRetries,
          delay,
          error: lastError,
          operation: operationName,
          timestamp: new Date(),
          metadata: options?.metadata
        });

        // Wait before retry
        await this.delay(delay);
      }
    }

    // All retries exhausted
    const totalTime = Date.now() - startTime;
    
    // Update circuit breaker
    if (this.config.enableCircuitBreaker) {
      this.recordCircuitBreakerFailure(operationName);
    }

    // Try graceful degradation
    if (this.config.enableGracefulDegradation && options?.fallback) {
      try {
        const fallbackData = await options.fallback();
        const result: ErrorRecoveryResult & { data?: T } = {
          success: true,
          attempts,
          totalTime,
          finalError: lastError,
          recovered: false,
          degraded: true,
          data: fallbackData,
          metadata: {
            operation: operationName,
            fallback: true,
            ...options?.metadata
          }
        };

        this.emit('operationDegraded', result);
        return result;
      } catch (fallbackError) {
        console.error('Fallback operation also failed:', fallbackError);
      }
    }

    // Complete failure
    const result: ErrorRecoveryResult & { data?: T } = {
      success: false,
      attempts,
      totalTime,
      finalError: lastError,
      recovered: false,
      degraded: false,
      metadata: {
        operation: operationName,
        ...options?.metadata
      }
    };

    this.emit('operationFailed', result);
    return result;
  }

  // Handle network errors with specific recovery strategies
  async handleNetworkError<T>(
    operation: () => Promise<T>,
    operationName: string,
    options?: {
      enableOfflineMode?: boolean;
      cacheData?: boolean;
      userMessage?: string;
    }
  ): Promise<ErrorRecoveryResult & { data?: T; gracefulDegradation?: GracefulDegradation }> {
    const result = await this.executeWithRecovery(operation, operationName, {
      maxRetries: 2,
      timeout: 10000,
      fallback: async () => {
        if (options?.enableOfflineMode) {
          // Return cached data or offline mode data
          return this.getOfflineData(operationName) as T;
        }
        throw new AppError({
          code: ErrorCode.NETWORK_ERROR,
          message: 'Network operation failed and no offline fallback available',
          retryable: false,
          userMessage: options?.userMessage || 'Network connection failed. Please try again later.',
          timestamp: new Date()
        });
      },
      metadata: {
        networkOperation: true,
        offlineMode: options?.enableOfflineMode,
        cacheData: options?.cacheData
      }
    });

    // Add graceful degradation info
    if (result.degraded) {
      result.gracefulDegradation = {
        enabled: true,
        offlineMode: options?.enableOfflineMode || false,
        cachedData: options?.cacheData || false,
        userMessage: options?.userMessage || 'Using offline data due to network issues'
      };
    }

    return result;
  }

  // Handle authentication errors with automatic token refresh
  async handleAuthError<T>(
    operation: () => Promise<T>,
    operationName: string,
    refreshTokenOperation?: () => Promise<string>
  ): Promise<ErrorRecoveryResult & { data?: T }> {
    return this.executeWithRecovery(operation, operationName, {
      maxRetries: 1,
      fallback: async () => {
        if (refreshTokenOperation) {
          try {
            // Try to refresh token
            await refreshTokenOperation();
            // Retry original operation with new token
            return await operation();
          } catch (refreshError) {
            throw new AppError({
              code: ErrorCode.AUTHENTICATION_FAILED,
              message: 'Token refresh failed',
              retryable: false,
              userMessage: 'Please log in again',
              timestamp: new Date(),
              context: { originalError: refreshError }
            });
          }
        }
        throw new AppError({
          code: ErrorCode.AUTHENTICATION_FAILED,
          message: 'Authentication failed and no refresh mechanism available',
          retryable: false,
          userMessage: 'Please log in again',
          timestamp: new Date()
        });
      },
      metadata: {
        authOperation: true,
        hasRefreshToken: !!refreshTokenOperation
      }
    });
  }

  // Handle validation errors with user-friendly messages
  async handleValidationError<T>(
    operation: () => Promise<T>,
    operationName: string,
    validationSchema?: any
  ): Promise<ErrorRecoveryResult & { data?: T; validationErrors?: string[] }> {
    return this.executeWithRecovery(operation, operationName, {
      maxRetries: 0, // Don't retry validation errors
      fallback: async () => {
        // Return default/empty data for validation errors
        return {} as T;
      },
      metadata: {
        validationOperation: true,
        hasSchema: !!validationSchema
      }
    });
  }

  // Get error statistics
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByOperation: Record<string, number>;
    recentErrors: AppError[];
    circuitBreakerStates: Record<string, CircuitBreakerState>;
  } {
    const errorsByType: Record<string, number> = {};
    const errorsByOperation: Record<string, number> = {};

    this.errorHistory.forEach(error => {
      errorsByType[error.code] = (errorsByType[error.code] || 0) + 1;
      const operation = error.context?.operation || 'unknown';
      errorsByOperation[operation] = (errorsByOperation[operation] || 0) + 1;
    });

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      errorsByOperation,
      recentErrors: this.errorHistory.slice(-10),
      circuitBreakerStates: Object.fromEntries(this.circuitBreakers)
    };
  }

  // Clear error history
  clearErrorHistory(): void {
    this.errorHistory = [];
    this.emit('errorHistoryCleared', { timestamp: new Date().toISOString() });
  }

  // Reset circuit breaker for specific operation
  resetCircuitBreaker(operationName: string): void {
    this.circuitBreakers.delete(operationName);
    this.emit('circuitBreakerReset', { operation: operationName, timestamp: new Date().toISOString() });
  }

  // Private helper methods
  private normalizeError(error: any, operationName: string): AppError {
    if (error instanceof AppError) {
      error.context = { ...error.context, operation: operationName };
      return error;
    }

    return new AppError({
      code: ErrorCode.UNKNOWN_ERROR,
      message: error.message || 'Unknown error occurred',
      retryable: this.isRetryableError(error),
      userMessage: 'An unexpected error occurred. Please try again.',
      timestamp: new Date(),
      context: { originalError: error, operation: operationName }
    });
  }

  private isRetryableError(error: any): boolean {
    if (error instanceof AppError) {
      return error.retryable;
    }

    // Network errors are generally retryable
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
      return true;
    }

    // Server errors (5xx) are retryable
    if (error.status >= 500 && error.status < 600) {
      return true;
    }

    // Timeout errors are retryable
    if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
      return true;
    }

    return false;
  }

  private shouldRetry(error: AppError, attempt: number, maxRetries: number): boolean {
    if (!error.retryable) {
      return false;
    }

    if (attempt > maxRetries) {
      return false;
    }

    // Don't retry authentication errors after first attempt
    if (error.code === ErrorCode.AUTHENTICATION_FAILED && attempt > 1) {
      return false;
    }

    // Don't retry validation errors
    if (error.code === ErrorCode.VALIDATION_ERROR) {
      return false;
    }

    return true;
  }

  private calculateDelay(attempt: number): number {
    if (!this.config.enableExponentialBackoff) {
      return this.config.baseDelay;
    }

    let delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
    
    // Add jitter to prevent thundering herd
    if (this.config.jitter) {
      const jitter = Math.random() * 0.1 * delay;
      delay += jitter;
    }

    return Math.min(delay, this.config.maxDelay);
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>, timeout?: number): Promise<T> {
    if (!timeout) {
      return operation();
    }

    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new AppError({
            code: ErrorCode.TIMEOUT_ERROR,
            message: 'Operation timed out',
            retryable: true,
            userMessage: 'Operation took too long. Please try again.',
            timestamp: new Date()
          }));
        }, timeout);
      })
    ]);
  }

  private isCircuitBreakerOpen(operationName: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(operationName);
    if (!circuitBreaker) {
      return false;
    }

    if (!circuitBreaker.isOpen) {
      return false;
    }

    // Check if timeout has passed
    if (Date.now() > circuitBreaker.nextAttemptTime.getTime()) {
      circuitBreaker.isOpen = false;
      return false;
    }

    return true;
  }

  private recordCircuitBreakerFailure(operationName: string): void {
    let circuitBreaker = this.circuitBreakers.get(operationName);
    
    if (!circuitBreaker) {
      circuitBreaker = {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: new Date(),
        nextAttemptTime: new Date(),
        threshold: this.config.circuitBreakerThreshold,
        timeout: this.config.circuitBreakerTimeout
      };
    }

    circuitBreaker.failureCount++;
    circuitBreaker.lastFailureTime = new Date();

    if (circuitBreaker.failureCount >= circuitBreaker.threshold) {
      circuitBreaker.isOpen = true;
      circuitBreaker.nextAttemptTime = new Date(Date.now() + circuitBreaker.timeout);
    }

    this.circuitBreakers.set(operationName, circuitBreaker);
  }

  private async handleCircuitBreakerFailure<T>(
    operationName: string,
    options?: { fallback?: () => Promise<T> }
  ): Promise<ErrorRecoveryResult & { data?: T }> {
    const circuitBreaker = this.circuitBreakers.get(operationName);
    
    if (options?.fallback) {
      try {
        const fallbackData = await options.fallback();
        return {
          success: true,
          attempts: 0,
          totalTime: 0,
          recovered: false,
          degraded: true,
          data: fallbackData,
          metadata: {
            operation: operationName,
            circuitBreaker: true,
            fallback: true
          }
        };
      } catch (fallbackError) {
        console.error('Fallback operation failed during circuit breaker:', fallbackError);
      }
    }

    return {
      success: false,
      attempts: 0,
      totalTime: 0,
      finalError: new AppError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: `Circuit breaker open for operation: ${operationName}`,
        retryable: false,
        userMessage: 'Service temporarily unavailable. Please try again later.',
        timestamp: new Date(),
        context: { operation: operationName, circuitBreaker: true }
      }),
      recovered: false,
      degraded: false,
      metadata: {
        operation: operationName,
        circuitBreaker: true
      }
    };
  }

  private recordError(error: AppError): void {
    this.errorHistory.push(error);
    
    // Keep only recent errors
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.maxErrorHistory);
    }

    this.emit('errorRecorded', { error, timestamp: new Date().toISOString() });
  }

  private getOfflineData(operationName: string): any {
    // In a real implementation, this would return cached data
    // For now, return empty object
    return {};
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const errorRecoveryManager = ErrorRecoveryManager.getInstance(); 