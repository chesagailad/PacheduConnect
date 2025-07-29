/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: 404 not found middleware - handles undefined routes
 */

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { notFound }; 