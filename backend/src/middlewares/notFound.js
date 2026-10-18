const AppError = require('../utils/AppError');

/**
 * 404 Not Found middleware.
 */
function notFound(req, res, next) {
  next(new AppError(`Not found: ${req.method} ${req.originalUrl}`, 404));
}

module.exports = notFound;
