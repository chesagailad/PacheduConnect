/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: auth - handles backend functionality
 */

const jwt = require('jsonwebtoken');
const { getUserById } = require('../services/userService');

/**
 * Optional authentication middleware for chatbot
 * Unlike strict auth middleware, this allows anonymous users
 * but attaches user info if token is provided
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - continue as anonymous user
      req.user = null;
      req.isAuthenticated = false;
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      req.user = null;
      req.isAuthenticated = false;
      return next();
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user details
      const user = await getUserById(decoded.userId || decoded.id);
      
      if (user) {
        req.user = user;
        req.isAuthenticated = true;
      } else {
        req.user = null;
        req.isAuthenticated = false;
      }
      
    } catch (jwtError) {
      // Invalid token - continue as anonymous user
      console.log('Invalid JWT token in chatbot:', jwtError.message);
      req.user = null;
      req.isAuthenticated = false;
    }
    
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    // Don't fail the request, just continue as anonymous
    req.user = null;
    req.isAuthenticated = false;
    next();
  }
}

/**
 * Middleware to extract user context for chatbot
 */
function extractUserContext(req, res, next) {
  // Add user context to request for chatbot processing
  req.chatContext = {
    isAuthenticated: req.isAuthenticated || false,
    userId: req.user?.id || null,
    userName: req.user?.name || null,
    userEmail: req.user?.email || null,
    kycStatus: req.user?.kycStatus || null,
    balance: req.user?.balance || 0
  };
  
  next();
}

/**
 * Rate limiting middleware for chatbot (simple in-memory implementation)
 */
const messageCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_MESSAGES_PER_WINDOW = 30; // 30 messages per minute

function rateLimitMessages(req, res, next) {
  const identifier = req.user?.id || req.ip;
  const now = Date.now();
  
  if (!messageCounts.has(identifier)) {
    messageCounts.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const userCount = messageCounts.get(identifier);
  
  if (now > userCount.resetTime) {
    // Reset the counter
    messageCounts.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  if (userCount.count >= MAX_MESSAGES_PER_WINDOW) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      response: 'You\'re sending messages too quickly. Please wait a moment before trying again.',
      retryAfter: Math.ceil((userCount.resetTime - now) / 1000)
    });
  }
  
  userCount.count++;
  messageCounts.set(identifier, userCount);
  next();
}

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [identifier, data] of messageCounts.entries()) {
    if (now > data.resetTime) {
      messageCounts.delete(identifier);
    }
  }
}, 5 * 60 * 1000);

module.exports = {
  optionalAuth,
  extractUserContext,
  rateLimitMessages
};