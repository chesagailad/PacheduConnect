const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const logger = require('../../utils/logger');

class ChatbotAuthService {
  constructor() {
    this.jwtSecret = process.env.CHATBOT_JWT_SECRET || process.env.JWT_SECRET || 'chatbot-secret';
    this.jwtExpiry = process.env.CHATBOT_JWT_EXPIRY || '24h';
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Generate JWT token for chatbot user
   * @param {object} userData - User data
   * @returns {string} JWT token
   */
  generateToken(userData) {
    try {
      const payload = {
        userId: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role || 'user',
        platform: userData.platform || 'web',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      };

      const token = jwt.sign(payload, this.jwtSecret, {
        expiresIn: this.jwtExpiry
      });

      logger.info('Chatbot JWT token generated', {
        userId: userData.id,
        platform: userData.platform
      });

      return token;
    } catch (error) {
      logger.error('Failed to generate chatbot JWT token:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {object} Decoded token payload
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      
      logger.debug('Chatbot JWT token verified', {
        userId: decoded.userId,
        platform: decoded.platform
      });

      return decoded;
    } catch (error) {
      logger.warn('Invalid chatbot JWT token:', error.message);
      throw new Error('Invalid authentication token');
    }
  }

  /**
   * Create anonymous user session
   * @param {string} platform - Platform (web, whatsapp, telegram)
   * @param {object} deviceInfo - Device information
   * @returns {object} Anonymous user data
   */
  createAnonymousUser(platform = 'web', deviceInfo = {}) {
    try {
      const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const userData = {
        id: anonymousId,
        type: 'anonymous',
        platform,
        deviceInfo,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };

      const token = this.generateToken(userData);

      logger.info('Anonymous chatbot user created', {
        anonymousId,
        platform,
        deviceInfo: Object.keys(deviceInfo)
      });

      return {
        user: userData,
        token,
        isAnonymous: true
      };
    } catch (error) {
      logger.error('Failed to create anonymous user:', error);
      throw new Error('Failed to create anonymous session');
    }
  }

  /**
   * Authenticate user with credentials
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} platform - Platform
   * @returns {object} Authentication result
   */
  async authenticateUser(email, password, platform = 'web') {
    try {
      // In a real implementation, you would verify against your user database
      // For now, we'll simulate authentication
      const userData = {
        id: `user_${email.replace('@', '_')}`,
        email,
        name: email.split('@')[0],
        role: 'user',
        platform,
        isVerified: true,
        lastLogin: new Date().toISOString()
      };

      const token = this.generateToken(userData);

      logger.info('Chatbot user authenticated', {
        userId: userData.id,
        email,
        platform
      });

      return {
        user: userData,
        token,
        isAnonymous: false
      };
    } catch (error) {
      logger.error('Failed to authenticate user:', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Get user preferences
   * @param {string} userId - User ID
   * @returns {object} User preferences
   */
  async getUserPreferences(userId) {
    try {
      // In a real implementation, you would fetch from database
      const preferences = {
        language: 'en',
        notifications: true,
        theme: 'light',
        autoTranslate: false,
        privacyLevel: 'standard',
        sessionTimeout: this.sessionTimeout
      };

      logger.debug('User preferences retrieved', { userId });
      return preferences;
    } catch (error) {
      logger.error('Failed to get user preferences:', error);
      return {
        language: 'en',
        notifications: true,
        theme: 'light',
        autoTranslate: false,
        privacyLevel: 'standard',
        sessionTimeout: this.sessionTimeout
      };
    }
  }

  /**
   * Update user preferences
   * @param {string} userId - User ID
   * @param {object} preferences - New preferences
   * @returns {object} Updated preferences
   */
  async updateUserPreferences(userId, preferences) {
    try {
      // In a real implementation, you would update the database
      const updatedPreferences = {
        ...preferences,
        updatedAt: new Date().toISOString()
      };

      logger.info('User preferences updated', {
        userId,
        updatedFields: Object.keys(preferences)
      });

      return updatedPreferences;
    } catch (error) {
      logger.error('Failed to update user preferences:', error);
      throw new Error('Failed to update preferences');
    }
  }

  /**
   * Get user session data
   * @param {string} userId - User ID
   * @returns {object} Session data
   */
  async getUserSession(userId) {
    try {
      // In a real implementation, you would fetch from database
      const sessionData = {
        userId,
        isActive: true,
        lastActivity: new Date().toISOString(),
        platform: 'web',
        deviceInfo: {},
        preferences: await this.getUserPreferences(userId)
      };

      return sessionData;
    } catch (error) {
      logger.error('Failed to get user session:', error);
      throw new Error('Failed to retrieve session data');
    }
  }

  /**
   * Update user session activity
   * @param {string} userId - User ID
   * @param {object} activityData - Activity data
   */
  async updateSessionActivity(userId, activityData = {}) {
    try {
      const updateData = {
        lastActivity: new Date().toISOString(),
        ...activityData
      };

      // In a real implementation, you would update the database
      logger.debug('User session activity updated', {
        userId,
        activityType: activityData.type || 'general'
      });
    } catch (error) {
      logger.error('Failed to update session activity:', error);
    }
  }

  /**
   * Validate user permissions
   * @param {string} userId - User ID
   * @param {string} action - Action to validate
   * @returns {boolean} Permission status
   */
  async validatePermission(userId, action) {
    try {
      // In a real implementation, you would check against user roles and permissions
      const allowedActions = [
        'send_message',
        'upload_media',
        'view_analytics',
        'export_data',
        'admin_access'
      ];

      const hasPermission = allowedActions.includes(action);
      
      logger.debug('Permission validation', {
        userId,
        action,
        hasPermission
      });

      return hasPermission;
    } catch (error) {
      logger.error('Failed to validate permission:', error);
      return false;
    }
  }

  /**
   * Create user profile
   * @param {object} userData - User data
   * @returns {object} Created profile
   */
  async createUserProfile(userData) {
    try {
      const profile = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone || null,
        country: userData.country || null,
        language: userData.language || 'en',
        preferences: await this.getUserPreferences(userData.id),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      logger.info('User profile created', {
        userId: profile.id,
        email: profile.email
      });

      return profile;
    } catch (error) {
      logger.error('Failed to create user profile:', error);
      throw new Error('Failed to create user profile');
    }
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {object} User profile
   */
  async getUserProfile(userId) {
    try {
      // In a real implementation, you would fetch from database
      const profile = {
        id: userId,
        email: `${userId}@example.com`,
        name: userId.replace('user_', ''),
        phone: null,
        country: 'Zimbabwe',
        language: 'en',
        preferences: await this.getUserPreferences(userId),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return profile;
    } catch (error) {
      logger.error('Failed to get user profile:', error);
      throw new Error('Failed to retrieve user profile');
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {object} updates - Profile updates
   * @returns {object} Updated profile
   */
  async updateUserProfile(userId, updates) {
    try {
      const currentProfile = await this.getUserProfile(userId);
      const updatedProfile = {
        ...currentProfile,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      logger.info('User profile updated', {
        userId,
        updatedFields: Object.keys(updates)
      });

      return updatedProfile;
    } catch (error) {
      logger.error('Failed to update user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  /**
   * Delete user account
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  async deleteUserAccount(userId) {
    try {
      // In a real implementation, you would delete from database
      logger.info('User account deleted', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to delete user account:', error);
      return false;
    }
  }

  /**
   * Get authentication statistics
   * @returns {object} Authentication statistics
   */
  getAuthStats() {
    return {
      jwtSecret: this.jwtSecret ? 'configured' : 'not_configured',
      jwtExpiry: this.jwtExpiry,
      sessionTimeout: this.sessionTimeout,
      supportedPlatforms: ['web', 'whatsapp', 'telegram']
    };
  }

  /**
   * Validate session timeout
   * @param {string} lastActivity - Last activity timestamp
   * @returns {boolean} Whether session is expired
   */
  isSessionExpired(lastActivity) {
    const lastActivityTime = new Date(lastActivity).getTime();
    const currentTime = Date.now();
    return (currentTime - lastActivityTime) > this.sessionTimeout;
  }

  /**
   * Refresh user session
   * @param {string} userId - User ID
   * @returns {object} Refreshed session data
   */
  async refreshSession(userId) {
    try {
      const sessionData = await this.getUserSession(userId);
      sessionData.lastActivity = new Date().toISOString();
      sessionData.isActive = true;

      logger.debug('User session refreshed', { userId });
      return sessionData;
    } catch (error) {
      logger.error('Failed to refresh session:', error);
      throw new Error('Failed to refresh session');
    }
  }
}

module.exports = new ChatbotAuthService(); 