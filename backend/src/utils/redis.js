let redis = null;

const connectRedis = async () => {
  // For testing, we'll use a simple mock or in-memory store
  if (process.env.NODE_ENV === 'test') {
    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      quit: jest.fn().mockResolvedValue('OK'),
    };
    global.redis = redis;
    return redis;
  }

  // For development/production, implement actual Redis connection
  try {
    const Redis = require('ioredis');
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    redis.on('connect', () => {
      console.log('Redis connected');
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    global.redis = redis;
    return redis;
  } catch (error) {
    console.warn('Redis not available, using memory store');
    // Fallback to in-memory store
    redis = new Map();
    global.redis = {
      get: (key) => Promise.resolve(redis.get(key)),
      set: (key, value) => Promise.resolve(redis.set(key, value)),
      del: (key) => Promise.resolve(redis.delete(key)),
      quit: () => Promise.resolve('OK'),
    };
    return global.redis;
  }
};

const getRedis = () => {
  return redis || global.redis;
};

module.exports = {
  connectRedis,
  getRedis
}; 