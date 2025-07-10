const Redis = require('ioredis');
const { logger } = require('./logger');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    redisClient.on('ready', () => {
      logger.info('Redis is ready');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

const getRedis = () => {
  if (!redisClient) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return redisClient;
};

module.exports = { connectRedis, getRedis }; 