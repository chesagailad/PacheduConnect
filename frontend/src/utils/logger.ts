/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: logger - handles frontend functionality
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  userAgent?: string;
  url?: string;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log errors and warnings
    if (this.isProduction) {
      return level === 'error' || level === 'warn';
    }
    return true;
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const logMethod = entry.level === 'error' ? 'error' : 
                     entry.level === 'warn' ? 'warn' : 
                     entry.level === 'info' ? 'info' : 'log';

    if (this.isDevelopment) {
      // In development, use full console output
      if (entry.data) {
        console[logMethod](`[${entry.level.toUpperCase()}] ${entry.message}`, entry.data);
      } else {
        console[logMethod](`[${entry.level.toUpperCase()}] ${entry.message}`);
      }
    } else if (this.isProduction && (entry.level === 'error' || entry.level === 'warn')) {
      // In production, only log minimal error/warning info without sensitive data
      console[logMethod](`[${entry.level.toUpperCase()}] ${entry.message}`);
    }
  }

  private sendToErrorTracking(entry: LogEntry): void {
    // In production, send errors to error tracking service
    if (this.isProduction && entry.level === 'error') {
      try {
        // This could be replaced with your error tracking service (Sentry, LogRocket, etc.)
        // For now, we'll just store it locally or send to an endpoint
        if (typeof window !== 'undefined' && 'navigator' in window && 'sendBeacon' in navigator) {
          const payload = JSON.stringify({
            message: entry.message,
            timestamp: entry.timestamp,
            url: entry.url,
            userAgent: entry.userAgent,
            // Don't send potentially sensitive data in production
          });
          
          // You can replace this with your actual error tracking endpoint
          navigator.sendBeacon('/api/errors', payload);
        }
      } catch (e) {
        // Silently fail if error tracking fails
      }
    }
  }

  debug(message: string, data?: any): void {
    const entry = this.createLogEntry('debug', message, data);
    this.logToConsole(entry);
  }

  info(message: string, data?: any): void {
    const entry = this.createLogEntry('info', message, data);
    this.logToConsole(entry);
  }

  warn(message: string, data?: any): void {
    const entry = this.createLogEntry('warn', message, data);
    this.logToConsole(entry);
    this.sendToErrorTracking(entry);
  }

  error(message: string, error?: any): void {
    const entry = this.createLogEntry('error', message, error);
    this.logToConsole(entry);
    this.sendToErrorTracking(entry);
  }

  // Convenience method for API errors
  apiError(message: string, error: any, context?: any): void {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const statusCode = error?.response?.status;
    const apiEndpoint = error?.config?.url;
    
    this.error(`API Error: ${message}`, {
      error: errorMessage,
      statusCode,
      endpoint: apiEndpoint,
      context,
    });
  }
}

// Create singleton instance
export const logger = new Logger();

// Export default for convenience
export default logger;