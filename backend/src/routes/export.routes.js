const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');

router.get('/listings/csv', exportController.exportListingCsv);
router.get('/listings/json', exportController.exportListingJson);
router.get('/batch/:id/csv', exportController.exportBatchCsv);
router.get('/batch/:id/json', exportController.exportBatchJson);

module.exports = router;
