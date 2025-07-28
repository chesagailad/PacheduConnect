/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: sessionService - handles backend functionality
 */

const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');

class SessionService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.sessionPrefix = 'chatbot:session:';
    this.userPrefix = 'chatbot:user:';
    this.sessionTTL = 24 * 60 * 60; // 24 hours in seconds

    // Handle Redis connection events
    this.redis.on('connect', () => {
      logger.info('Redis connected for chatbot sessions');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    this.redis.on('close', () => {
      logger.warn('Redis connection closed');
    });
  }

  /**
   * Create a new session
   * @param {string} userId - User identifier
   * @param {string} platform - Platform (web, whatsapp, telegram)
   * @returns {object} Session object
   */
  async createSession(userId, platform = 'web') {
    if (!userId) {
      throw new Error('Invalid user ID');
    }

    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      userId,
      platform,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messages: [],
      context: {}
    };

    try {
      // Store session in Redis
      await this.redis.setex(
        `${this.sessionPrefix}${sessionId}`,
        this.sessionTTL,
        JSON.stringify(session)
      );

      // Add session to user's session list
      await this.redis.sadd(`${this.userPrefix}${userId}`, sessionId);
      await this.redis.expire(`${this.userPrefix}${userId}`, this.sessionTTL);

      logger.info(`Session created: ${sessionId} for user: ${userId}`);
      return session;
    } catch (error) {
      logger.error('Failed to create session:', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session identifier
   * @returns {object|null} Session object or null
   */
  async getSession(sessionId) {
    if (!sessionId) {
      throw new Error('Invalid session ID');
    }

    try {
      const sessionData = await this.redis.get(`${this.sessionPrefix}${sessionId}`);
      if (!sessionData) {
        return null;
      }

      const session = JSON.parse(sessionData);
      
      // Update last activity
      session.lastActivity = new Date().toISOString();
      await this.redis.setex(
        `${this.sessionPrefix}${sessionId}`,
        this.sessionTTL,
        JSON.stringify(session)
      );

      return session;
    } catch (error) {
      logger.error('Failed to get session:', error);
      throw new Error('Failed to retrieve session');
    }
  }

  /**
   * Get all sessions for a user
   * @param {string} userId - User identifier
   * @returns {array} Array of session objects
   */
  async getSessionsByUserId(userId) {
    if (!userId) {
      throw new Error('Invalid user ID');
    }

    try {
      const sessionIds = await this.redis.smembers(`${this.userPrefix}${userId}`);
      const sessions = [];

      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId);
        if (session) {
          sessions.push(session);
        }
      }

      return sessions;
    } catch (error) {
      logger.error('Failed to get user sessions:', error);
      throw new Error('Failed to retrieve user sessions');
    }
  }

  /**
   * Add message to session
   * @param {string} sessionId - Session identifier
   * @param {object} message - Message object
   */
  async addMessage(sessionId, message) {
    if (!sessionId) {
      throw new Error('Invalid session ID');
    }

    if (!message || typeof message !== 'object') {
      throw new Error('Invalid message format');
    }

    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Add timestamp if not provided
      if (!message.timestamp) {
        message.timestamp = new Date().toISOString();
      }

      session.messages.push(message);
      session.lastActivity = new Date().toISOString();

      // Store updated session
      await this.redis.setex(
        `${this.sessionPrefix}${sessionId}`,
        this.sessionTTL,
        JSON.stringify(session)
      );

      logger.debug(`Message added to session: ${sessionId}`);
    } catch (error) {
      logger.error('Failed to add message to session:', error);
      throw error;
    }
  }

  /**
   * Update session context
   * @param {string} sessionId - Session identifier
   * @param {object} context - Context object
   * @returns {object} Updated session
   */
  async updateContext(sessionId, context) {
    if (!sessionId) {
      throw new Error('Invalid session ID');
    }

    if (!context || typeof context !== 'object') {
      throw new Error('Invalid context format');
    }

    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.context = { ...session.context, ...context };
      session.lastActivity = new Date().toISOString();

      // Update session in Redis
      await this.redis.setex(
        `${this.sessionPrefix}${sessionId}`,
        this.sessionTTL,
        JSON.stringify(session)
      );

      logger.info(`Session context updated: ${sessionId}`);
      return session;
    } catch (error) {
      logger.error('Failed to update session context:', error);
      throw new Error('Failed to update session context');
    }
  }

  /**
   * Update session properties
   * @param {string} sessionId - Session identifier
   * @param {object} updates - Properties to update
   * @returns {object} Updated session
   */
  async updateSession(sessionId, updates) {
    if (!sessionId) {
      throw new Error('Invalid session ID');
    }

    if (!updates || typeof updates !== 'object') {
      throw new Error('Invalid updates format');
    }

    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Update session properties
      Object.assign(session, updates);
      session.lastActivity = new Date().toISOString();

      // Update session in Redis
      await this.redis.setex(
        `${this.sessionPrefix}${sessionId}`,
        this.sessionTTL,
        JSON.stringify(session)
      );

      logger.info(`Session updated: ${sessionId}`);
      return session;
    } catch (error) {
      logger.error('Failed to update session:', error);
      throw new Error('Failed to update session');
    }
  }

  /**
   * Remove session
   * @param {string} sessionId - Session identifier
   */
  async removeSession(sessionId) {
    if (!sessionId) {
      throw new Error('Invalid session ID');
    }

    try {
      const session = await this.getSession(sessionId);
      if (session) {
        // Remove session from user's session list
        await this.redis.srem(`${this.userPrefix}${session.userId}`, sessionId);
      }

      // Remove session data
      await this.redis.del(`${this.sessionPrefix}${sessionId}`);

      logger.info(`Session removed: ${sessionId}`);
    } catch (error) {
      logger.error('Failed to remove session:', error);
      throw new Error('Failed to remove session');
    }
  }

  /**
   * Remove expired sessions
   */
  async removeExpiredSessions() {
    try {
      const pattern = `${this.sessionPrefix}*`;
      const keys = await this.redis.keys(pattern);
      let removedCount = 0;

      for (const key of keys) {
        const sessionData = await this.redis.get(key);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          const lastActivity = new Date(session.lastActivity);
          const hoursSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);

          if (hoursSinceActivity > 24) {
            await this.removeSession(session.id);
            removedCount++;
          }
        }
      }

      logger.info(`Removed ${removedCount} expired sessions`);
      return removedCount;
    } catch (error) {
      logger.error('Failed to remove expired sessions:', error);
      throw new Error('Failed to remove expired sessions');
    }
  }

  /**
   * Get all sessions (for admin purposes)
   * @returns {array} Array of all session objects
   */
  async getAllSessions() {
    try {
      const pattern = `${this.sessionPrefix}*`;
      const keys = await this.redis.keys(pattern);
      const sessions = [];

      for (const key of keys) {
        const sessionData = await this.redis.get(key);
        if (sessionData) {
          sessions.push(JSON.parse(sessionData));
        }
      }

      return sessions;
    } catch (error) {
      logger.error('Failed to get all sessions:', error);
      throw new Error('Failed to retrieve all sessions');
    }
  }

  /**
   * Get sessions by platform
   * @param {string} platform - Platform name
   * @returns {array} Array of session objects
   */
  async getSessionsByPlatform(platform) {
    try {
      const allSessions = await this.getAllSessions();
      return allSessions.filter(session => session.platform === platform);
    } catch (error) {
      logger.error('Failed to get sessions by platform:', error);
      throw new Error('Failed to retrieve sessions by platform');
    }
  }

  /**
   * Get total session count
   * @returns {number} Total number of sessions
   */
  async getTotalSessions() {
    try {
      const pattern = `${this.sessionPrefix}*`;
      const keys = await this.redis.keys(pattern);
      return keys.length;
    } catch (error) {
      logger.error('Failed to get total sessions:', error);
      throw new Error('Failed to get total sessions');
    }
  }

  /**
   * Get active sessions count (sessions with activity in last hour)
   * @returns {number} Number of active sessions
   */
  async getActiveSessions() {
    try {
      const allSessions = await this.getAllSessions();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      return allSessions.filter(session => {
        const lastActivity = new Date(session.lastActivity);
        return lastActivity > oneHourAgo;
      }).length;
    } catch (error) {
      logger.error('Failed to get active sessions:', error);
      throw new Error('Failed to get active sessions');
    }
  }

  /**
   * Clear all sessions (for testing)
   */
  async clearAllSessions() {
    try {
      const pattern = `${this.sessionPrefix}*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      // Also clear user session lists
      const userPattern = `${this.userPrefix}*`;
      const userKeys = await this.redis.keys(userPattern);
      
      if (userKeys.length > 0) {
        await this.redis.del(...userKeys);
      }

      logger.info('All sessions cleared');
    } catch (error) {
      logger.error('Failed to clear all sessions:', error);
      throw new Error('Failed to clear all sessions');
    }
  }

  /**
   * Get session statistics
   * @returns {object} Statistics object
   */
  async getSessionStatistics() {
    try {
      const totalSessions = await this.getTotalSessions();
      const activeSessions = await this.getActiveSessions();
      const allSessions = await this.getAllSessions();

      const platformStats = {};
      allSessions.forEach(session => {
        platformStats[session.platform] = (platformStats[session.platform] || 0) + 1;
      });

      return {
        total: totalSessions,
        active: activeSessions,
        platforms: platformStats,
        averageMessagesPerSession: allSessions.length > 0 
          ? allSessions.reduce((sum, session) => sum + session.messages.length, 0) / allSessions.length 
          : 0
      };
    } catch (error) {
      logger.error('Failed to get session statistics:', error);
      throw new Error('Failed to get session statistics');
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    try {
      await this.redis.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Failed to close Redis connection:', error);
    }
  }
}

module.exports = new SessionService();