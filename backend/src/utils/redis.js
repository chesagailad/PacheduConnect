/**
 * Redis Connection Manager
 * 
 * This module manages Redis connections for the PacheduConnect backend application.
 * It provides a singleton Redis client with connection management, error handling,
 * and logging for session storage, caching, and real-time data operations.
 * 
 * Features:
 * - Singleton Redis client for consistent connection management
 * - Automatic connection retry and failover handling
 * - Comprehensive error logging and monitoring
 * - Lazy connection for performance optimization
 * - Event-driven connection status monitoring
 * 
 * Use Cases:
 * - Session storage and management
 * - Caching frequently accessed data
 * - Real-time fraud detection analytics
 * - Rate limiting and abuse prevention
 * - Temporary data storage for transactions
 * 
 * Configuration:
 * - REDIS_URL: Redis connection string from environment variables
 * - Retry delay: 100ms for failover scenarios
 * - Max retries: Unlimited for persistent connections
 * - Lazy connect: True for performance optimization
 * 
 * @author PacheduConnect Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

const Redis = require('ioredis');
const { logger } = require('./logger');

/**
 * Redis Client Instance
 * 
 * Singleton Redis client instance for the application.
 * Initialized as null and set during connection establishment.
 */
let redisClient;

/**
 * Connect to Redis Server
 * 
 * Establishes a connection to the Redis server with comprehensive
 * error handling and event monitoring. The connection is configured
 * for high availability and performance in production environments.
 * 
 * @returns {Promise<Redis>} Connected Redis client instance
 * @throws {Error} If connection fails or Redis is unavailable
 */
const connectRedis = async () => {
  try {
    // Create Redis client with production-ready configuration
    redisClient = new Redis(process.env.REDIS_URL, {
      retryDelayOnFailover: 100,        // 100ms delay between retry attempts
      enableReadyCheck: false,           // Disable ready check for performance
      maxRetriesPerRequest: null,        // Unlimited retries for persistence
      lazyConnect: true,                 // Lazy connection for performance
    });

    // Monitor connection events for logging and debugging
    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    redisClient.on('ready', () => {
      logger.info('Redis is ready');
    });

    // Establish the connection
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

/**
 * Get Redis Client Instance
 * 
 * Returns the singleton Redis client instance. Throws an error
 * if the client is not connected, ensuring proper initialization.
 * 
 * @returns {Redis} Connected Redis client instance
 * @throws {Error} If Redis is not connected
 */
const getRedis = () => {
  if (!redisClient) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return redisClient;
};

// Export connection management functions
module.exports = { connectRedis, getRedis }; 