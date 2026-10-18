const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

/**
 * Global error handling middleware.
 */
function errorHandler(err, req, res, _next) {
  // Log the error
  if (err instanceof AppError) {
    logger.warn({ statusCode: err.statusCode, message: err.message, details: err.details }, 'AppError');
  } else {
    logger.error({ err }, 'Unhandled error');
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError ? err.message : 'Internal server error';

  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      message,
      details: err instanceof AppError ? err.details : undefined,
    },
  });
}

module.exports = errorHandler;
