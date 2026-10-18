const express = require('express');
const router = express.Router();
const listingsController = require('../controllers/listings.controller');
const { uploadImages } = require('../middlewares/upload');
const validate = require('../middlewares/validate');
const {
  regenerateFieldSchema,
  updateListingSchema,
} = require('../schemas/listing.schema');

router.post('/', uploadImages, listingsController.createListing);
router.get('/', listingsController.getListings);
router.get('/:id', listingsController.getListing);
router.patch('/:id', validate(updateListingSchema), listingsController.updateListing);
router.post('/:id/regenerate', validate(regenerateFieldSchema), listingsController.regenerateField);
router.delete('/:id', listingsController.deleteListing);

module.exports = router;
