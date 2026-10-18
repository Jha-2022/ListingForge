const express = require('express');
const router = express.Router();
const { generateLicense, verifyLicense } = require('../services/license.service');
const AppError = require('../utils/AppError');

router.post('/verify', (req, res) => {
  const { license_key } = req.body;
  if (!license_key) {
    throw new AppError('license_key is required', 400);
  }
  const result = verifyLicense(license_key);
  res.json({ success: true, data: result, error: null });
});

router.post('/generate', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    throw new AppError('Valid email is required', 400);
  }
  const licenseKey = generateLicense(email);
  res.json({ success: true, data: { email, license_key: licenseKey }, error: null });
});

module.exports = router;
