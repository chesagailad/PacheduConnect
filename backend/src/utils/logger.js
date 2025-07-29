/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: logger - handles backend functionality
 */

/**
 * Winston Logger Configuration
 * 
 * This module configures Winston logger for the PacheduConnect backend application.
 * It provides structured logging with daily rotation, error tracking, and
 * console output for development and debugging.
 * 
 * Features:
 * - Structured JSON logging with timestamps
 * - Daily log rotation to prevent disk space issues
 * - Separate error log files for critical issues
 * - Console output with colorized formatting for development
 * - Configurable log levels via environment variables
 * 
 * Log Levels:
 * - error: Critical errors that require immediate attention
 * - warn: Warning messages for potential issues
 * - info: General application information
 * - debug: Detailed debugging information
 * - verbose: Very detailed debugging information
 * 
 * Log Files:
 * - error-YYYY-MM-DD.log: Contains only error level messages
 * - combined-YYYY-MM-DD.log: Contains all log levels
 * 
 * @author PacheduConnect Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

/**
 * Log Format Configuration
 * 
 * Defines the format for all log messages including:
 * - Timestamp in YYYY-MM-DD HH:mm:ss format
 * - Error stack traces for debugging
 * - JSON structure for machine-readable logs
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Winston Logger Instance
 * 
 * Configured with multiple transports for different logging needs:
 * - Console transport for development and debugging
 * - Daily rotating file transport for error logs
 * - Daily rotating file transport for all logs
 * 
 * Configuration:
 * - Log level: Configurable via LOG_LEVEL environment variable (default: info)
 * - Service name: 'pachedu-backend' for log identification
 * - File rotation: Daily rotation with 20MB max size and 14 days retention
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'pachedu-backend' },
  transports: [
    // Console transport for development and debugging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Daily rotating file for error logs only
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
    }),
    // Daily rotating file for all log levels
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

// Export the configured logger instance
module.exports = { logger }; 