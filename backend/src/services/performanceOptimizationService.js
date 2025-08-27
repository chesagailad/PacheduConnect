/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Performance Optimization Service for Security Services
 */

const { logger } = require('../utils/logger');
const cluster = require('cluster');
const os = require('os');

/**
 * Performance Optimization Service
 * 
 * Provides performance optimization for security services:
 * - Load balancing and clustering
 * - Caching strategies
 * - Database optimization
 * - Memory management
 * - Response time optimization
 * - Resource monitoring
 */
class PerformanceOptimizationService {
  constructor() {
    this.metrics = {
      responseTimes: [],
      memoryUsage: [],
      cpuUsage: [],
      throughput: [],
      errorRates: []
    };
    
    this.cache = new Map();
    this.cacheConfig = {
      maxSize: 10000,
      ttl: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000 // 1 minute
    };
    
    this.optimizationConfig = {
      enableClustering: process.env.NODE_ENV === 'production',
      maxWorkers: os.cpus().length,
      enableCaching: true,
      enableCompression: true,
      enableRateLimiting: true
    };
    
    this.startOptimization();
  }

  /**
   * Start performance optimization
   */
  startOptimization() {
    logger.info('Performance optimization service started');
    
    // Start clustering if enabled
    if (this.optimizationConfig.enableClustering && cluster.isMaster) {
      this.startClustering();
    }
    
    // Start cache cleanup
    if (this.optimizationConfig.enableCaching) {
      setInterval(() => {
        this.cleanupCache();
      }, this.cacheConfig.cleanupInterval);
    }
    
    // Start metrics collection
    setInterval(() => {
      this.collectMetrics();
    }, 30 * 1000); // Every 30 seconds
    
    // Start performance monitoring
    setInterval(() => {
      this.monitorPerformance();
    }, 60 * 1000); // Every minute
  }

  /**
   * Start clustering for load balancing
   */
  startClustering() {
    logger.info(`Starting cluster with ${this.optimizationConfig.maxWorkers} workers`);
    
    for (let i = 0; i < this.optimizationConfig.maxWorkers; i++) {
      cluster.fork();
    }
    
    cluster.on('exit', (worker, code, signal) => {
      logger.warn(`Worker ${worker.process.pid} died. Restarting...`);
      cluster.fork();
    });
    
    cluster.on('online', (worker) => {
      logger.info(`Worker ${worker.process.pid} is online`);
    });
  }

  /**
   * Cache management
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  setCache(key, value, ttl = this.cacheConfig.ttl) {
    if (!this.optimizationConfig.enableCaching) return;
    
    if (this.cache.size >= this.cacheConfig.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  getCache(key) {
    if (!this.optimizationConfig.enableCaching) return null;
    
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }

  /**
   * Evict oldest cache entries
   */
  evictOldest() {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove 10% of oldest entries
    const toRemove = Math.ceil(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Optimize database queries
   * @param {Object} query - Database query
   * @returns {Object} Optimized query
   */
  optimizeDatabaseQuery(query) {
    const optimized = { ...query };
    
    // Add query hints
    if (query.type === 'SELECT') {
      optimized.hints = ['USE_INDEX', 'FORCE_INDEX'];
    }
    
    // Add pagination if not present
    if (!optimized.limit && !optimized.offset) {
      optimized.limit = 100;
      optimized.offset = 0;
    }
    
    // Add caching hint
    optimized.cacheable = true;
    
    return optimized;
  }

  /**
   * Optimize response time
   * @param {Function} handler - Request handler
   * @returns {Function} Optimized handler
   */
  optimizeResponseTime(handler) {
    return async (req, res, next) => {
      const startTime = Date.now();
      
      try {
        await handler(req, res, next);
        
        const responseTime = Date.now() - startTime;
        this.recordResponseTime(responseTime);
        
        // Add performance headers
        res.set('X-Response-Time', `${responseTime}ms`);
        res.set('X-Cache-Status', this.getCacheStatus(req.url));
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        this.recordResponseTime(responseTime);
        this.recordError(error);
        
        next(error);
      }
    };
  }

  /**
   * Record response time
   * @param {number} responseTime - Response time in milliseconds
   */
  recordResponseTime(responseTime) {
    this.metrics.responseTimes.push(responseTime);
    
    // Keep only last 1000 measurements
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
    }
  }

  /**
   * Record error
   * @param {Error} error - Error object
   */
  recordError(error) {
    this.metrics.errorRates.push({
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack
    });
    
    // Keep only last 100 errors
    if (this.metrics.errorRates.length > 100) {
      this.metrics.errorRates = this.metrics.errorRates.slice(-100);
    }
  }

  /**
   * Get cache status for URL
   * @param {string} url - Request URL
   * @returns {string} Cache status
   */
  getCacheStatus(url) {
    return this.getCache(url) ? 'HIT' : 'MISS';
  }

  /**
   * Collect performance metrics
   */
  collectMetrics() {
    const metrics = {
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime(),
      responseTime: this.getAverageResponseTime(),
      errorRate: this.getErrorRate(),
      cacheHitRate: this.getCacheHitRate(),
      throughput: this.getThroughput()
    };
    
    this.metrics.memoryUsage.push(metrics.memoryUsage);
    this.metrics.cpuUsage.push(metrics.cpuUsage);
    this.metrics.throughput.push(metrics.throughput);
    
    // Keep only last 100 measurements
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
      this.metrics.cpuUsage = this.metrics.cpuUsage.slice(-100);
      this.metrics.throughput = this.metrics.throughput.slice(-100);
    }
    
    logger.info('Performance metrics collected', metrics);
  }

  /**
   * Monitor performance and trigger optimizations
   */
  monitorPerformance() {
    const avgResponseTime = this.getAverageResponseTime();
    const errorRate = this.getErrorRate();
    const memoryUsage = this.getCurrentMemoryUsage();
    
    // Trigger optimizations based on metrics
    if (avgResponseTime > 1000) {
      this.triggerResponseTimeOptimization();
    }
    
    if (errorRate > 0.05) {
      this.triggerErrorRateOptimization();
    }
    
    if (memoryUsage > 0.8) {
      this.triggerMemoryOptimization();
    }
    
    // Log performance status
    logger.info('Performance monitoring', {
      avgResponseTime,
      errorRate,
      memoryUsage,
      cacheSize: this.cache.size
    });
  }

  /**
   * Get average response time
   * @returns {number} Average response time
   */
  getAverageResponseTime() {
    if (this.metrics.responseTimes.length === 0) return 0;
    
    const sum = this.metrics.responseTimes.reduce((acc, time) => acc + time, 0);
    return sum / this.metrics.responseTimes.length;
  }

  /**
   * Get error rate
   * @returns {number} Error rate (0-1)
   */
  getErrorRate() {
    if (this.metrics.errorRates.length === 0) return 0;
    
    const recentErrors = this.metrics.errorRates.filter(
      error => Date.now() - error.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );
    
    return recentErrors.length / 100; // Assuming 100 requests per 5 minutes
  }

  /**
   * Get current memory usage
   * @returns {number} Memory usage percentage
   */
  getCurrentMemoryUsage() {
    const usage = process.memoryUsage();
    return usage.heapUsed / usage.heapTotal;
  }

  /**
   * Get cache hit rate
   * @returns {number} Cache hit rate (0-1)
   */
  getCacheHitRate() {
    // This would be calculated based on actual cache hits/misses
    return 0.8; // Placeholder
  }

  /**
   * Get throughput
   * @returns {number} Requests per second
   */
  getThroughput() {
    // This would be calculated based on actual request count
    return 100; // Placeholder
  }

  /**
   * Trigger response time optimization
   */
  triggerResponseTimeOptimization() {
    logger.warn('Response time optimization triggered');
    
    // Increase cache TTL
    this.cacheConfig.ttl = Math.min(this.cacheConfig.ttl * 1.5, 30 * 60 * 1000);
    
    // Enable compression
    this.optimizationConfig.enableCompression = true;
    
    // Log optimization actions
    logger.info('Response time optimizations applied', {
      newCacheTTL: this.cacheConfig.ttl,
      compressionEnabled: this.optimizationConfig.enableCompression
    });
  }

  /**
   * Trigger error rate optimization
   */
  triggerErrorRateOptimization() {
    logger.warn('Error rate optimization triggered');
    
    // Increase rate limiting
    this.optimizationConfig.enableRateLimiting = true;
    
    // Reduce cache TTL to ensure fresh data
    this.cacheConfig.ttl = Math.max(this.cacheConfig.ttl * 0.8, 60 * 1000);
    
    // Log optimization actions
    logger.info('Error rate optimizations applied', {
      rateLimitingEnabled: this.optimizationConfig.enableRateLimiting,
      newCacheTTL: this.cacheConfig.ttl
    });
  }

  /**
   * Trigger memory optimization
   */
  triggerMemoryOptimization() {
    logger.warn('Memory optimization triggered');
    
    // Clear cache
    this.cache.clear();
    
    // Reduce cache size
    this.cacheConfig.maxSize = Math.max(this.cacheConfig.maxSize * 0.8, 1000);
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Log optimization actions
    logger.info('Memory optimizations applied', {
      cacheCleared: true,
      newMaxCacheSize: this.cacheConfig.maxSize,
      garbageCollection: global.gc ? 'triggered' : 'not available'
    });
  }

  /**
   * Get performance report
   * @returns {Object} Performance report
   */
  getPerformanceReport() {
    return {
      timestamp: new Date().toISOString(),
      metrics: {
        avgResponseTime: this.getAverageResponseTime(),
        errorRate: this.getErrorRate(),
        memoryUsage: this.getCurrentMemoryUsage(),
        cacheHitRate: this.getCacheHitRate(),
        throughput: this.getThroughput()
      },
      optimization: {
        clustering: this.optimizationConfig.enableClustering,
        caching: this.optimizationConfig.enableCaching,
        compression: this.optimizationConfig.enableCompression,
        rateLimiting: this.optimizationConfig.enableRateLimiting
      },
      cache: {
        size: this.cache.size,
        maxSize: this.cacheConfig.maxSize,
        ttl: this.cacheConfig.ttl
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };
  }

  /**
   * Optimize security service performance
   * @param {Object} service - Security service instance
   * @returns {Object} Optimized service
   */
  optimizeSecurityService(service) {
    // Add caching to service methods
    if (service.analyzeTransaction) {
      const originalAnalyze = service.analyzeTransaction.bind(service);
      service.analyzeTransaction = async (transaction, user) => {
        const cacheKey = `fraud_analysis_${transaction.id}_${user.id}`;
        const cached = this.getCache(cacheKey);
        
        if (cached) {
          return cached;
        }
        
        const result = await originalAnalyze(transaction, user);
        this.setCache(cacheKey, result, 60 * 1000); // Cache for 1 minute
        
        return result;
      };
    }
    
    if (service.verifyIdentity) {
      const originalVerify = service.verifyIdentity.bind(service);
      service.verifyIdentity = async (sessionId, identityData) => {
        const cacheKey = `kyc_identity_${sessionId}`;
        const cached = this.getCache(cacheKey);
        
        if (cached) {
          return cached;
        }
        
        const result = await originalVerify(sessionId, identityData);
        this.setCache(cacheKey, result, 5 * 60 * 1000); // Cache for 5 minutes
        
        return result;
      };
    }
    
    return service;
  }

  /**
   * Get optimization recommendations
   * @returns {Array} Optimization recommendations
   */
  getOptimizationRecommendations() {
    const recommendations = [];
    
    const avgResponseTime = this.getAverageResponseTime();
    const errorRate = this.getErrorRate();
    const memoryUsage = this.getCurrentMemoryUsage();
    
    if (avgResponseTime > 1000) {
      recommendations.push({
        type: 'RESPONSE_TIME',
        priority: 'HIGH',
        description: 'Response time is above 1 second. Consider enabling caching and compression.',
        actions: ['Enable caching', 'Enable compression', 'Optimize database queries']
      });
    }
    
    if (errorRate > 0.05) {
      recommendations.push({
        type: 'ERROR_RATE',
        priority: 'HIGH',
        description: 'Error rate is above 5%. Consider enabling rate limiting and error handling.',
        actions: ['Enable rate limiting', 'Improve error handling', 'Add retry logic']
      });
    }
    
    if (memoryUsage > 0.8) {
      recommendations.push({
        type: 'MEMORY_USAGE',
        priority: 'MEDIUM',
        description: 'Memory usage is above 80%. Consider reducing cache size and optimizing memory usage.',
        actions: ['Reduce cache size', 'Enable garbage collection', 'Optimize memory usage']
      });
    }
    
    if (this.cache.size > this.cacheConfig.maxSize * 0.9) {
      recommendations.push({
        type: 'CACHE_SIZE',
        priority: 'LOW',
        description: 'Cache is nearly full. Consider increasing cache size or reducing TTL.',
        actions: ['Increase cache size', 'Reduce cache TTL', 'Implement cache eviction']
      });
    }
    
    return recommendations;
  }
}

// Export singleton instance
module.exports = new PerformanceOptimizationService(); 