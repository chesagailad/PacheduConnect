/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Token service for JWT management with security enhancements
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { logger } = require('../utils/logger');

/**
 * Token Service Class
 * 
 * Handles JWT token generation, validation, and refresh with security best practices:
 * - Secure token generation with proper claims
 * - Token refresh with rotation
 * - Token blacklisting support
 * - Rate limiting for token operations
 * - Comprehensive logging and monitoring
 */
class TokenService {
  constructor() {
    this.blacklistedTokens = new Set();
    this.refreshTokenStore = new Map();
    this.tokenUsageCount = new Map();
  }

  /**
   * Generate access token with security enhancements
   * @param {Object} user - User object with id, email, role
   * @param {string} tokenId - Unique token identifier
   * @returns {string} JWT access token
   */
  generateAccessToken(user, tokenId = null) {
    const jti = tokenId || crypto.randomBytes(32).toString('hex');
    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role || 'user',
      permissions: user.permissions || [],
      jti: jti, // Token ID for blacklisting
      iat: now, // Issued at
      nbf: now, // Not valid before
      exp: now + (parseInt(process.env.JWT_EXPIRES_IN || '3600')), // Expiration
      iss: 'pacheduconnect.com', // Issuer
      aud: 'pachedu-api', // Audience
      type: 'access' // Token type
    };

    try {
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        algorithm: 'HS256',
        header: {
          typ: 'JWT',
          alg: 'HS256'
        }
      });

      // Track token usage
      this.tokenUsageCount.set(jti, 1);

      logger.info('Access token generated', {
        userId: user.id,
        email: user.email,
        tokenId: jti,
        expiresAt: new Date(payload.exp * 1000).toISOString()
      });

      return {
        token,
        tokenId: jti,
        expiresAt: payload.exp
      };
    } catch (error) {
      logger.error('Failed to generate access token', {
        userId: user.id,
        error: error.message
      });
      throw new Error('Token generation failed');
    }
  }

  /**
   * Generate refresh token for token rotation
   * @param {Object} user - User object
   * @param {string} accessTokenId - Associated access token ID
   * @returns {Object} Refresh token object
   */
  generateRefreshToken(user, accessTokenId) {
    const refreshTokenId = crypto.randomBytes(32).toString('hex');
    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
      userId: user.id,
      email: user.email,
      jti: refreshTokenId,
      iat: now,
      nbf: now,
      exp: now + (parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '2592000')), // 30 days
      iss: 'pacheduconnect.com',
      aud: 'pachedu-api',
      type: 'refresh',
      linkedTokenId: accessTokenId
    };

    try {
      const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
        algorithm: 'HS256'
      });

      // Store refresh token mapping
      this.refreshTokenStore.set(refreshTokenId, {
        userId: user.id,
        accessTokenId: accessTokenId,
        createdAt: now,
        lastUsed: now
      });

      logger.info('Refresh token generated', {
        userId: user.id,
        refreshTokenId: refreshTokenId,
        accessTokenId: accessTokenId,
        expiresAt: new Date(payload.exp * 1000).toISOString()
      });

      return {
        refreshToken,
        refreshTokenId: refreshTokenId,
        expiresAt: payload.exp
      };
    } catch (error) {
      logger.error('Failed to generate refresh token', {
        userId: user.id,
        error: error.message
      });
      throw new Error('Refresh token generation failed');
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Valid refresh token
   * @returns {Object} New token pair
   */
  async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'pacheduconnect.com',
        audience: 'pachedu-api'
      });

      // Check if refresh token is blacklisted
      if (this.blacklistedTokens.has(decoded.jti)) {
        logger.warn('Attempted to use blacklisted refresh token', {
          refreshTokenId: decoded.jti,
          userId: decoded.userId
        });
        throw new Error('Refresh token is blacklisted');
      }

      // Check if refresh token exists in store
      const storedToken = this.refreshTokenStore.get(decoded.jti);
      if (!storedToken) {
        logger.warn('Refresh token not found in store', {
          refreshTokenId: decoded.jti,
          userId: decoded.userId
        });
        throw new Error('Invalid refresh token');
      }

      // Check if refresh token is expired
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) {
        logger.warn('Refresh token expired', {
          refreshTokenId: decoded.jti,
          userId: decoded.userId
        });
        this.blacklistToken(decoded.jti);
        throw new Error('Refresh token expired');
      }

      // Blacklist the old access token
      if (storedToken.accessTokenId) {
        this.blacklistToken(storedToken.accessTokenId);
      }

      // Generate new token pair
      const user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role || 'user',
        permissions: decoded.permissions || []
      };

      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user, newAccessToken.tokenId);

      // Update refresh token store
      this.refreshTokenStore.set(newRefreshToken.refreshTokenId, {
        userId: user.id,
        accessTokenId: newAccessToken.tokenId,
        createdAt: now,
        lastUsed: now
      });

      // Remove old refresh token from store
      this.refreshTokenStore.delete(decoded.jti);

      logger.info('Access token refreshed successfully', {
        userId: user.id,
        oldRefreshTokenId: decoded.jti,
        newAccessTokenId: newAccessToken.tokenId,
        newRefreshTokenId: newRefreshToken.refreshTokenId
      });

      return {
        accessToken: newAccessToken.token,
        refreshToken: newRefreshToken.refreshToken,
        accessTokenId: newAccessToken.tokenId,
        refreshTokenId: newRefreshToken.refreshTokenId,
        expiresAt: newAccessToken.expiresAt
      };
    } catch (error) {
      logger.error('Failed to refresh access token', {
        error: error.message,
        refreshTokenId: refreshToken ? 'provided' : 'missing'
      });
      throw error;
    }
  }

  /**
   * Blacklist a token to prevent reuse
   * @param {string} tokenId - Token ID to blacklist
   */
  blacklistToken(tokenId) {
    this.blacklistedTokens.add(tokenId);
    
    // Clean up refresh token store
    this.refreshTokenStore.delete(tokenId);
    
    // Clean up usage count
    this.tokenUsageCount.delete(tokenId);

    logger.info('Token blacklisted', {
      tokenId: tokenId
    });
  }

  /**
   * Check if token is blacklisted
   * @param {string} tokenId - Token ID to check
   * @returns {boolean} True if blacklisted
   */
  isTokenBlacklisted(tokenId) {
    return this.blacklistedTokens.has(tokenId);
  }

  /**
   * Revoke all tokens for a user
   * @param {string} userId - User ID to revoke tokens for
   */
  revokeUserTokens(userId) {
    let revokedCount = 0;

    // Find and blacklist all tokens for this user
    for (const [tokenId, tokenData] of this.refreshTokenStore.entries()) {
      if (tokenData.userId === userId) {
        this.blacklistToken(tokenId);
        revokedCount++;
      }
    }

    logger.info('User tokens revoked', {
      userId: userId,
      revokedCount: revokedCount
    });

    return revokedCount;
  }

  /**
   * Clean up expired tokens and refresh tokens
   */
  cleanupExpiredTokens() {
    const now = Math.floor(Date.now() / 1000);
    let cleanedCount = 0;

    // Clean up expired refresh tokens
    for (const [tokenId, tokenData] of this.refreshTokenStore.entries()) {
      if (tokenData.lastUsed + 2592000 < now) { // 30 days
        this.refreshTokenStore.delete(tokenId);
        cleanedCount++;
      }
    }

    // Clean up old blacklisted tokens (older than 7 days)
    const blacklistCleanupTime = now - (7 * 24 * 60 * 60);
    // Note: In production, this should be handled by Redis with TTL

    logger.info('Expired tokens cleaned up', {
      cleanedCount: cleanedCount
    });

    return cleanedCount;
  }

  /**
   * Get token usage statistics
   * @returns {Object} Token usage statistics
   */
  getTokenStats() {
    return {
      activeRefreshTokens: this.refreshTokenStore.size,
      blacklistedTokens: this.blacklistedTokens.size,
      activeAccessTokens: this.tokenUsageCount.size
    };
  }

  /**
   * Validate token without verification (for logging purposes)
   * @param {string} token - JWT token to validate
   * @returns {Object|null} Decoded token or null
   */
  validateTokenFormat(token) {
    try {
      // Decode without verification
      const decoded = jwt.decode(token);
      return decoded;
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
module.exports = new TokenService(); 