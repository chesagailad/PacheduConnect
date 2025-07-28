/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: JWT authentication middleware - validates tokens and attaches user data to requests
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