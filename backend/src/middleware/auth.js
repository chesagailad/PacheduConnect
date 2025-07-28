/**
 * Authentication Middleware
 * 
 * This middleware provides JWT-based authentication for the PacheduConnect
 * platform. It validates JWT tokens from request headers and attaches
 * user information to the request object for downstream middleware and routes.
 * 
 * Features:
 * - JWT token validation using jsonwebtoken
 * - Bearer token extraction from Authorization header
 * - User information attachment to request object
 * - Comprehensive error handling for invalid tokens
 * - Secure token verification with environment secret
 * 
 * Security Features:
 * - Bearer token authentication scheme
 * - JWT signature verification
 * - Token expiration validation
 * - Secure secret key management
 * - Proper error responses without information leakage
 * 
 * Request Flow:
 * 1. Extract Authorization header
 * 2. Validate Bearer token format
 * 3. Verify JWT signature and expiration
 * 4. Attach user data to request object
 * 5. Continue to next middleware/route
 * 
 * Error Handling:
 * - Missing Authorization header
 * - Invalid Bearer token format
 * - Expired or invalid JWT tokens
 * - Malformed token structure
 * 
 * Usage:
 * - Apply to protected routes
 * - Ensures user authentication
 * - Provides user context to routes
 * - Enables role-based access control
 * 
 * @author PacheduConnect Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware Function
 * 
 * Validates JWT tokens and attaches user information to the request object.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = auth; 