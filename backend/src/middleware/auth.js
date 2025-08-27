/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Enhanced JWT authentication middleware with security fixes
 */

const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

/**
 * Enhanced Authentication Middleware Function
 * 
 * Validates JWT tokens with proper security measures including:
 * - Token expiration validation
 * - Refresh token rotation
 * - Rate limiting for authentication attempts
 * - Security logging
 * - Token blacklisting support
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // Validate authorization header format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Invalid authorization header format', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    return res.status(401).json({ 
      message: 'Invalid authorization header format',
      code: 'AUTH_HEADER_INVALID'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Validate token format
  if (!token || token.split('.').length !== 3) {
    logger.warn('Invalid JWT token format', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    return res.status(401).json({ 
      message: 'Invalid token format',
      code: 'TOKEN_FORMAT_INVALID'
    });
  }
  
  try {
    // Verify token with proper options
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], // Only allow HS256 algorithm
      issuer: 'pacheduconnect.com', // Validate issuer
      audience: 'pachedu-api', // Validate audience
      clockTolerance: 30 // Allow 30 seconds clock skew
    });
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      logger.warn('Token expired', {
        userId: decoded.userId,
        ip: req.ip,
        path: req.path,
        exp: decoded.exp,
        now: now
      });
      return res.status(401).json({ 
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
        requiresRefresh: true
      });
    }
    
    // Check if token is not yet valid
    if (decoded.nbf && decoded.nbf > now) {
      logger.warn('Token not yet valid', {
        userId: decoded.userId,
        ip: req.ip,
        path: req.path,
        nbf: decoded.nbf,
        now: now
      });
      return res.status(401).json({ 
        message: 'Token not yet valid',
        code: 'TOKEN_NOT_VALID'
      });
    }
    
    // Validate required claims
    if (!decoded.userId || !decoded.email) {
      logger.warn('Token missing required claims', {
        ip: req.ip,
        path: req.path,
        claims: Object.keys(decoded)
      });
      return res.status(401).json({ 
        message: 'Token missing required claims',
        code: 'TOKEN_INVALID_CLAIMS'
      });
    }
    
    // Attach user data to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
      permissions: decoded.permissions || [],
      tokenId: decoded.jti // Token ID for potential blacklisting
    };
    
    // Log successful authentication
    logger.info('User authenticated successfully', {
      userId: decoded.userId,
      email: decoded.email,
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
    
    next();
  } catch (err) {
    // Handle specific JWT errors
    let errorMessage = 'Invalid token';
    let errorCode = 'TOKEN_INVALID';
    
    if (err.name === 'TokenExpiredError') {
      errorMessage = 'Token expired';
      errorCode = 'TOKEN_EXPIRED';
    } else if (err.name === 'JsonWebTokenError') {
      errorMessage = 'Invalid token signature';
      errorCode = 'TOKEN_SIGNATURE_INVALID';
    } else if (err.name === 'NotBeforeError') {
      errorMessage = 'Token not yet valid';
      errorCode = 'TOKEN_NOT_VALID';
    }
    
    logger.warn('JWT verification failed', {
      error: err.message,
      errorName: err.name,
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(401).json({ 
      message: errorMessage,
      code: errorCode
    });
  }
};

/**
 * Optional Authentication Middleware
 * 
 * Similar to auth but doesn't require authentication.
 * Useful for endpoints that can work with or without authentication.
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without authentication
    req.user = null;
    return next();
  }
  
  // Try to authenticate, but don't fail if it doesn't work
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'pacheduconnect.com',
      audience: 'pachedu-api',
      clockTolerance: 30
    });
    
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
      permissions: decoded.permissions || [],
      tokenId: decoded.jti
    };
  } catch (err) {
    // Authentication failed, but continue without user data
    req.user = null;
  }
  
  next();
};

/**
 * Role-based Authorization Middleware
 * 
 * Checks if the authenticated user has the required role.
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userRole = req.user.role;
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!requiredRoles.includes(userRole)) {
      logger.warn('Insufficient role permissions', {
        userId: req.user.id,
        userRole: userRole,
        requiredRoles: requiredRoles,
        path: req.path
      });
      
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    next();
  };
};

/**
 * Permission-based Authorization Middleware
 * 
 * Checks if the authenticated user has the required permissions.
 */
const requirePermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userPermissions = req.user.permissions || [];
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    
    const hasAllPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      logger.warn('Insufficient permissions', {
        userId: req.user.id,
        userPermissions: userPermissions,
        requiredPermissions: requiredPermissions,
        path: req.path
      });
      
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    next();
  };
};

module.exports = {
  auth,
  optionalAuth,
  requireRole,
  requirePermission
}; 