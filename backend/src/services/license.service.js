const crypto = require('crypto');
const { env } = require('../config/env');
const logger = require('../utils/logger');

/**
 * Generate an HMAC-signed license key for a given email.
 * Format: base64(email):base64(hmac)
 *
 * @param {string} email
 * @returns {string} license key
 */
function generateLicense(email) {
  const emailB64 = Buffer.from(email).toString('base64');
  const hmac = crypto.createHmac('sha256', env.LICENSE_SECRET)
    .update(email)
    .digest('base64');
  return `${emailB64}:${hmac}`;
}

/**
 * Verify an HMAC-signed license key.
 *
 * @param {string} licenseKey
 * @returns {{ valid: boolean, email?: string, reason?: string }}
 */
function verifyLicense(licenseKey) {
  try {
    const parts = licenseKey.split(':');
    if (parts.length !== 2) {
      return { valid: false, reason: 'Invalid format' };
    }

    const [emailB64, providedHmac] = parts;
    const email = Buffer.from(emailB64, 'base64').toString('utf-8');

    if (!email || !email.includes('@')) {
      return { valid: false, reason: 'Invalid email in license' };
    }

    const expectedHmac = crypto.createHmac('sha256', env.LICENSE_SECRET)
      .update(email)
      .digest('base64');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(providedHmac),
      Buffer.from(expectedHmac)
    );

    if (isValid) {
      return { valid: true, email };
    } else {
      return { valid: false, reason: 'Invalid signature' };
    }
  } catch (err) {
    logger.warn({ error: err.message }, 'License verification error');
    return { valid: false, reason: 'Verification error' };
  }
}

module.exports = { generateLicense, verifyLicense };
