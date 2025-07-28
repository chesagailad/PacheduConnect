const logger = require('../../utils/logger');
const Redis = require('ioredis');

class AnalyticsService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0
    });

    this.analyticsPrefix = 'chatbot:analytics:';
    this.eventPrefix = 'chatbot:events:';
    this.metricsPrefix = 'chatbot:metrics:';
  }

  /**
   * Track user interaction event
   * @param {object} event - Event object
   */
  async trackEvent(event) {
    try {
      const {
        userId,
        sessionId,
        platform,
        eventType,
        intent,
        confidence,
        entities,
        responseTime,
        message,
        response,
        error = null
      } = event;

      const eventData = {
        timestamp: new Date().toISOString(),
        userId,
        sessionId,
        platform,
        eventType,
        intent,
        confidence,
        entities: entities || [],
        responseTime,
        message,
        response,
        error
      };

      // Store event in Redis with TTL
      const eventKey = `${this.eventPrefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await this.redis.setex(eventKey, 30 * 24 * 60 * 60, JSON.stringify(eventData)); // 30 days TTL

      // Update real-time metrics
      await this.updateMetrics(eventData);

      logger.debug(`Analytics event tracked: ${eventType} for user ${userId}`);
    } catch (error) {
      logger.error('Failed to track analytics event:', error);
    }
  }

  /**
   * Update real-time metrics
   * @param {object} eventData - Event data
   */
  async updateMetrics(eventData) {
    try {
      const { eventType, platform, intent, confidence, responseTime, error } = eventData;
      const now = new Date();
      const hourKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`;
      const dayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // Update hourly metrics
      await this.redis.hincrby(`${this.metricsPrefix}hourly:${hourKey}`, 'total_events', 1);
      await this.redis.hincrby(`${this.metricsPrefix}hourly:${hourKey}`, `event_${eventType}`, 1);
      await this.redis.hincrby(`${this.metricsPrefix}hourly:${hourKey}`, `platform_${platform}`, 1);
      
      if (intent) {
        await this.redis.hincrby(`${this.metricsPrefix}hourly:${hourKey}`, `intent_${intent}`, 1);
      }

      if (error) {
        await this.redis.hincrby(`${this.metricsPrefix}hourly:${hourKey}`, 'errors', 1);
      }

      // Update daily metrics
      await this.redis.hincrby(`${this.metricsPrefix}daily:${dayKey}`, 'total_events', 1);
      await this.redis.hincrby(`${this.metricsPrefix}daily:${dayKey}`, `event_${eventType}`, 1);
      await this.redis.hincrby(`${this.metricsPrefix}daily:${dayKey}`, `platform_${platform}`, 1);
      
      if (intent) {
        await this.redis.hincrby(`${this.metricsPrefix}daily:${dayKey}`, `intent_${intent}`, 1);
      }

      if (error) {
        await this.redis.hincrby(`${this.metricsPrefix}daily:${dayKey}`, 'errors', 1);
      }

      // Track response time
      if (responseTime) {
        await this.redis.lpush(`${this.metricsPrefix}response_times`, responseTime);
        await this.redis.ltrim(`${this.metricsPrefix}response_times`, 0, 999); // Keep last 1000
      }

      // Track confidence scores
      if (confidence) {
        await this.redis.lpush(`${this.metricsPrefix}confidence_scores`, confidence);
        await this.redis.ltrim(`${this.metricsPrefix}confidence_scores`, 0, 999); // Keep last 1000
      }

      // Set TTL for metrics
      await this.redis.expire(`${this.metricsPrefix}hourly:${hourKey}`, 7 * 24 * 60 * 60); // 7 days
      await this.redis.expire(`${this.metricsPrefix}daily:${dayKey}`, 90 * 24 * 60 * 60); // 90 days
      await this.redis.expire(`${this.metricsPrefix}response_times`, 30 * 24 * 60 * 60); // 30 days
      await this.redis.expire(`${this.metricsPrefix}confidence_scores`, 30 * 24 * 60 * 60); // 30 days

    } catch (error) {
      logger.error('Failed to update metrics:', error);
    }
  }

  /**
   * Get analytics dashboard data
   * @param {string} period - Time period (hour, day, week, month)
   * @returns {object} Analytics data
   */
  async getAnalytics(period = 'day') {
    try {
      const now = new Date();
      let metrics = {};

      switch (period) {
        case 'hour':
          const hourKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`;
          metrics = await this.redis.hgetall(`${this.metricsPrefix}hourly:${hourKey}`);
          break;
        case 'day':
          const dayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          metrics = await this.redis.hgetall(`${this.metricsPrefix}daily:${dayKey}`);
          break;
        case 'week':
          metrics = await this.getWeeklyMetrics(now);
          break;
        case 'month':
          metrics = await this.getMonthlyMetrics(now);
          break;
      }

      // Get response time statistics
      const responseTimes = await this.redis.lrange(`${this.metricsPrefix}response_times`, 0, -1);
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + parseFloat(time), 0) / responseTimes.length 
        : 0;

      // Get confidence statistics
      const confidenceScores = await this.redis.lrange(`${this.metricsPrefix}confidence_scores`, 0, -1);
      const avgConfidence = confidenceScores.length > 0 
        ? confidenceScores.reduce((sum, score) => sum + parseFloat(score), 0) / confidenceScores.length 
        : 0;

      return {
        period,
        timestamp: now.toISOString(),
        metrics: this.parseMetrics(metrics),
        performance: {
          avgResponseTime: Math.round(avgResponseTime * 100) / 100,
          avgConfidence: Math.round(avgConfidence * 100) / 100,
          totalEvents: parseInt(metrics.total_events || 0),
          errorRate: metrics.total_events ? (parseInt(metrics.errors || 0) / parseInt(metrics.total_events)) * 100 : 0
        }
      };
    } catch (error) {
      logger.error('Failed to get analytics:', error);
      throw new Error('Failed to retrieve analytics');
    }
  }

  /**
   * Get weekly metrics
   * @param {Date} now - Current date
   * @returns {object} Weekly metrics
   */
  async getWeeklyMetrics(now) {
    const metrics = {};
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dayMetrics = await this.redis.hgetall(`${this.metricsPrefix}daily:${dayKey}`);
      
      // Aggregate metrics
      Object.keys(dayMetrics).forEach(key => {
        metrics[key] = (parseInt(metrics[key] || 0) + parseInt(dayMetrics[key]));
      });
    }

    return metrics;
  }

  /**
   * Get monthly metrics
   * @param {Date} now - Current date
   * @returns {object} Monthly metrics
   */
  async getMonthlyMetrics(now) {
    const metrics = {};
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayMetrics = await this.redis.hgetall(`${this.metricsPrefix}daily:${dayKey}`);
      
      // Aggregate metrics
      Object.keys(dayMetrics).forEach(key => {
        metrics[key] = (parseInt(metrics[key] || 0) + parseInt(dayMetrics[key]));
      });
    }

    return metrics;
  }

  /**
   * Parse metrics from Redis hash
   * @param {object} metrics - Raw metrics from Redis
   * @returns {object} Parsed metrics
   */
  parseMetrics(metrics) {
    const parsed = {
      events: {},
      platforms: {},
      intents: {},
      errors: parseInt(metrics.errors || 0)
    };

    Object.keys(metrics).forEach(key => {
      if (key.startsWith('event_')) {
        const eventType = key.replace('event_', '');
        parsed.events[eventType] = parseInt(metrics[key]);
      } else if (key.startsWith('platform_')) {
        const platform = key.replace('platform_', '');
        parsed.platforms[platform] = parseInt(metrics[key]);
      } else if (key.startsWith('intent_')) {
        const intent = key.replace('intent_', '');
        parsed.intents[intent] = parseInt(metrics[key]);
      }
    });

    return parsed;
  }

  /**
   * Get user journey analytics
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID (optional)
   * @returns {object} User journey data
   */
  async getUserJourney(userId, sessionId = null) {
    try {
      const pattern = sessionId 
        ? `${this.eventPrefix}*` 
        : `${this.eventPrefix}*`;
      
      const keys = await this.redis.keys(pattern);
      const events = [];

      for (const key of keys) {
        const eventData = await this.redis.get(key);
        if (eventData) {
          const event = JSON.parse(eventData);
          if (event.userId === userId && (!sessionId || event.sessionId === sessionId)) {
            events.push(event);
          }
        }
      }

      // Sort events by timestamp
      events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Analyze journey
      const journey = {
        userId,
        sessionId,
        totalEvents: events.length,
        firstInteraction: events[0]?.timestamp,
        lastInteraction: events[events.length - 1]?.timestamp,
        events: events,
        intentFlow: events.map(e => e.intent).filter(Boolean),
        platformUsage: events.reduce((acc, e) => {
          acc[e.platform] = (acc[e.platform] || 0) + 1;
          return acc;
        }, {}),
        avgConfidence: events.length > 0 
          ? events.reduce((sum, e) => sum + (e.confidence || 0), 0) / events.length 
          : 0,
        avgResponseTime: events.length > 0 
          ? events.reduce((sum, e) => sum + (e.responseTime || 0), 0) / events.length 
          : 0,
        errorCount: events.filter(e => e.error).length
      };

      return journey;
    } catch (error) {
      logger.error('Failed to get user journey:', error);
      throw new Error('Failed to retrieve user journey');
    }
  }

  /**
   * Get intent performance analytics
   * @param {string} period - Time period
   * @returns {object} Intent performance data
   */
  async getIntentPerformance(period = 'day') {
    try {
      const analytics = await this.getAnalytics(period);
      const intents = analytics.metrics.intents;
      
      const performance = Object.keys(intents).map(intent => ({
        intent,
        count: intents[intent],
        percentage: (intents[intent] / analytics.metrics.total_events) * 100
      }));

      return performance.sort((a, b) => b.count - a.count);
    } catch (error) {
      logger.error('Failed to get intent performance:', error);
      throw new Error('Failed to retrieve intent performance');
    }
  }

  /**
   * Get platform usage analytics
   * @param {string} period - Time period
   * @returns {object} Platform usage data
   */
  async getPlatformUsage(period = 'day') {
    try {
      const analytics = await this.getAnalytics(period);
      const platforms = analytics.metrics.platforms;
      
      const usage = Object.keys(platforms).map(platform => ({
        platform,
        count: platforms[platform],
        percentage: (platforms[platform] / analytics.metrics.total_events) * 100
      }));

      return usage.sort((a, b) => b.count - a.count);
    } catch (error) {
      logger.error('Failed to get platform usage:', error);
      throw new Error('Failed to retrieve platform usage');
    }
  }

  /**
   * Export analytics data
   * @param {string} period - Time period
   * @param {string} format - Export format (json, csv)
   * @returns {string} Exported data
   */
  async exportAnalytics(period = 'day', format = 'json') {
    try {
      const analytics = await this.getAnalytics(period);
      
      if (format === 'csv') {
        return this.convertToCSV(analytics);
      }
      
      return JSON.stringify(analytics, null, 2);
    } catch (error) {
      logger.error('Failed to export analytics:', error);
      throw new Error('Failed to export analytics');
    }
  }

  /**
   * Convert analytics to CSV format
   * @param {object} analytics - Analytics data
   * @returns {string} CSV data
   */
  convertToCSV(analytics) {
    const lines = [];
    
    // Header
    lines.push('Metric,Value');
    
    // Basic metrics
    lines.push(`Total Events,${analytics.performance.totalEvents}`);
    lines.push(`Average Response Time,${analytics.performance.avgResponseTime}`);
    lines.push(`Average Confidence,${analytics.performance.avgConfidence}`);
    lines.push(`Error Rate,${analytics.performance.errorRate}%`);
    
    // Events
    Object.keys(analytics.metrics.events).forEach(event => {
      lines.push(`Event: ${event},${analytics.metrics.events[event]}`);
    });
    
    // Platforms
    Object.keys(analytics.metrics.platforms).forEach(platform => {
      lines.push(`Platform: ${platform},${analytics.metrics.platforms[platform]}`);
    });
    
    // Intents
    Object.keys(analytics.metrics.intents).forEach(intent => {
      lines.push(`Intent: ${intent},${analytics.metrics.intents[intent]}`);
    });
    
    return lines.join('\n');
  }

  /**
   * Close Redis connection
   */
  async close() {
    try {
      await this.redis.quit();
      logger.info('Analytics Redis connection closed');
    } catch (error) {
      logger.error('Failed to close analytics Redis connection:', error);
    }
  }
}

module.exports = new AnalyticsService(); 