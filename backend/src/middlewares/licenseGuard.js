const { verifyLicense } = require('../services/license.service');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const FREE_BATCH_LIMIT = 10;

/**
 * Middleware that blocks batch jobs exceeding FREE_BATCH_LIMIT items
 * unless a valid license key is provided.
 */
function licenseGuard(req, _res, next) {
  const itemCount = req.batchItemCount || 0;

  if (itemCount <= FREE_BATCH_LIMIT) {
    return next();
  }

  const licenseKey = req.headers['x-license-key'] || req.body?.license_key;

  if (!licenseKey) {
    return next(new AppError(
      `Batch exceeds ${FREE_BATCH_LIMIT} items. A license key is required for larger batches.`,
      402
    ));
  }

  const result = verifyLicense(licenseKey);
  if (!result.valid) {
    logger.warn({ reason: result.reason }, 'Invalid license key');
    return next(new AppError(`Invalid license key: ${result.reason}`, 402));
  }

  logger.info({ email: result.email }, 'License verified for batch');
  req.licenseEmail = result.email;
  next();
}

module.exports = licenseGuard;
