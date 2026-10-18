const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batch.controller');
const { uploadBatch } = require('../middlewares/upload');
const licenseGuard = require('../middlewares/licenseGuard');

router.post('/', uploadBatch, licenseGuard, batchController.createBatchJob);
router.get('/', batchController.getBatchJobs);
router.get('/:id', batchController.getBatchJob);
router.post('/:id/items/:itemId/retry', batchController.retryBatchItem);
router.get('/:id/events', batchController.batchEvents);

module.exports = router;
