/**
 * Chatbot Session Service
 * Manages user sessions and conversation state
 */

const Redis = require('ioredis');
const crypto = require('crypto');
const { logger } = require('../../utils/logger');

class SessionService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    });

    // Handle Redis connection events
    this.redis.on('connect', () => {
      logger.info('Redis connected for chatbot sessions');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error', { error: error.message });
    });

    this.redis.on('close', () => {
      logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });
  }

  /**
   * Generate collision-safe session ID
   * Uses timestamp + cryptographically secure random bytes to prevent collisions
   */
  generateSessionId(userId) {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString('hex'); // 16 character hex string
    return `session:${userId}:${timestamp}:${randomBytes}`;
  }

  /**
   * Create or update user session
   */
  async createSession(userId, sessionData = {}) {
    try {
      const sessionId = this.generateSessionId(userId);
      const session = {
        id: sessionId,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        data: sessionData,
        conversationHistory: [],
        context: {}
      };

      await this.redis.setex(sessionId, 3600, JSON.stringify(session)); // 1 hour TTL
      
      logger.info('Session created', { sessionId, userId });
      return session;
    } catch (error) {
      logger.error('Session creation failed', { userId, error: error.message });
      throw new Error('Failed to create session');
    }
  }

  /**
   * Get user session
   */
  async getSession(sessionId) {
    try {
      const sessionData = await this.redis.get(sessionId);
      if (!sessionData) {
        return null;
      }

      const session = JSON.parse(sessionData);
      session.updatedAt = new Date().toISOString();
      
      // Extend session TTL
      await this.redis.expire(sessionId, 3600);
      
      return session;
    } catch (error) {
      logger.error('Session retrieval failed', { sessionId, error: error.message });
      return null;
    }
  }

  /**
   * Update session data
   */
  async updateSession(sessionId, updates) {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const updatedSession = {
        ...session,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await this.redis.setex(sessionId, 3600, JSON.stringify(updatedSession));
      
      logger.info('Session updated', { sessionId });
      return updatedSession;
    } catch (error) {
      logger.error('Session update failed', { sessionId, error: error.message });
      throw new Error('Failed to update session');
    }
  }

  /**
   * Generate collision-safe message ID
   * Uses timestamp + cryptographically secure random bytes to prevent collisions
   */
  generateMessageId() {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(4).toString('hex'); // 8 character hex string for messages
    return `msg_${timestamp}_${randomBytes}`;
  }

  /**
   * Add message to conversation history
   */
  async addMessage(sessionId, message) {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const messageEntry = {
        id: this.generateMessageId(),
        timestamp: new Date().toISOString(),
        type: message.type || 'user',
        content: message.content,
        metadata: message.metadata || {}
      };

      session.conversationHistory.push(messageEntry);
      
      // Keep only last 50 messages
      if (session.conversationHistory.length > 50) {
        session.conversationHistory = session.conversationHistory.slice(-50);
      }

      await this.updateSession(sessionId, { conversationHistory: session.conversationHistory });
      
      return messageEntry;
    } catch (error) {
      logger.error('Message addition failed', { sessionId, error: error.message });
      throw new Error('Failed to add message');
    }
  }

  /**
   * Update conversation context
   */
  async updateContext(sessionId, context) {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const updatedContext = {
        ...session.context,
        ...context
      };

      await this.updateSession(sessionId, { context: updatedContext });
      
      return updatedContext;
    } catch (error) {
      logger.error('Context update failed', { sessionId, error: error.message });
      throw new Error('Failed to update context');
    }
  }

  /**
   * End user session
   */
  async endSession(sessionId) {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return false;
      }

      session.status = 'ended';
      session.endedAt = new Date().toISOString();

      await this.redis.setex(sessionId, 86400, JSON.stringify(session)); // 24 hours TTL for ended sessions
      
      logger.info('Session ended', { sessionId });
      return true;
    } catch (error) {
      logger.error('Session end failed', { sessionId, error: error.message });
      return false;
    }
  }

  /**
   * Get active sessions for user using non-blocking SCAN
   */
  async getUserSessions(userId) {
    try {
      const pattern = `session:${userId}:*`;
      const sessions = [];
      let cursor = '0';
      const count = 100; // Process 100 keys per scan iteration

      do {
        // Use SCAN with MATCH pattern and COUNT for non-blocking iteration
        const [newCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', count);
        cursor = newCursor;

        // Fetch session data for each key found in this iteration
        for (const key of keys) {
          const sessionData = await this.redis.get(key);
          if (sessionData) {
            try {
              const session = JSON.parse(sessionData);
              if (session.status === 'active') {
                sessions.push(session);
              }
            } catch (parseError) {
              logger.warn('Failed to parse session data', { key, error: parseError.message });
            }
          }
        }
      } while (cursor !== '0'); // Continue until scan is complete

      return sessions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (error) {
      logger.error('User sessions retrieval failed', { userId, error: error.message });
      return [];
    }
  }

  /**
   * Clean up expired sessions using non-blocking SCAN
   */
  async cleanupExpiredSessions() {
    try {
      const pattern = 'session:*';
      let cleanedCount = 0;
      let cursor = '0';
      const count = 100; // Process 100 keys per scan iteration

      do {
        // Use SCAN with MATCH pattern and COUNT for non-blocking iteration
        const [newCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', count);
        cursor = newCursor;

        // Process each key found in this iteration
        for (const key of keys) {
          const sessionData = await this.redis.get(key);
          if (sessionData) {
            try {
              const session = JSON.parse(sessionData);
              const sessionAge = Date.now() - new Date(session.updatedAt).getTime();
              
              // Remove sessions older than 24 hours
              if (sessionAge > 24 * 60 * 60 * 1000) {
                await this.redis.del(key);
                cleanedCount++;
              }
            } catch (parseError) {
              logger.warn('Failed to parse session data during cleanup', { key, error: parseError.message });
            }
          }
        }
      } while (cursor !== '0'); // Continue until scan is complete

      logger.info('Session cleanup completed', { cleanedCount });
      return cleanedCount;
    } catch (error) {
      logger.error('Session cleanup failed', { error: error.message });
      return 0;
    }
  }

  /**
   * Get session statistics using non-blocking SCAN
   */
  async getSessionStats() {
    try {
      const pattern = 'session:*';
      const stats = {
        total: 0,
        active: 0,
        ended: 0,
        recent: 0
      };

      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      let cursor = '0';
      const count = 100; // Process 100 keys per scan iteration

      do {
        // Use SCAN with MATCH pattern and COUNT for non-blocking iteration
        const [newCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', count);
        cursor = newCursor;

        // Process each key found in this iteration
        for (const key of keys) {
          const sessionData = await this.redis.get(key);
          if (sessionData) {
            try {
              const session = JSON.parse(sessionData);
              stats.total++;
              
              if (session.status === 'active') {
                stats.active++;
              } else if (session.status === 'ended') {
                stats.ended++;
              }

              if (new Date(session.updatedAt).getTime() > oneHourAgo) {
                stats.recent++;
              }
            } catch (parseError) {
              logger.warn('Failed to parse session data during stats collection', { key, error: parseError.message });
            }
          }
        }
      } while (cursor !== '0'); // Continue until scan is complete

      return stats;
    } catch (error) {
      logger.error('Session stats retrieval failed', { error: error.message });
      return { total: 0, active: 0, ended: 0, recent: 0 };
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    try {
      await this.redis.disconnect();
      logger.info('Session service Redis connection closed');
    } catch (error) {
      logger.error('Session service close failed', { error: error.message });
    }
  }
}

module.exports = new SessionService();