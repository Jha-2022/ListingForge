const express = require('express');
const router = express.Router();
const ollamaService = require('../services/ollama.service');
const asyncHandler = require('../utils/asyncHandler');
const { env } = require('../config/env');

router.get('/', asyncHandler(async (_req, res) => {
  const ollamaStatus = await ollamaService.checkStatus();
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'listingforge-backend',
      version: '1.0.0',
      model: env.VLM_MODEL,
      ollama: ollamaStatus,
    },
    error: null,
  });
}));

module.exports = router;
