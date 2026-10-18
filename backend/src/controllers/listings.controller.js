const { v4: uuidv4 } = require('uuid');
const path = require('path');
const listingsRepo = require('../repositories/listings.repo');
const imageService = require('../services/image.service');
const visionService = require('../services/vision.service');
const writerService = require('../services/writer.service');
const validatorService = require('../services/validator.service');
const voiceProfilesRepo = require('../repositories/voiceProfiles.repo');
const { env } = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * POST /api/listings
 * Create a new listing: upload images, run vision + writer pipeline.
 */
const createListing = asyncHandler(async (req, res) => {
  const { marketplace, language, voice_profile_id, product_name_hint,
    material, size, price, target_buyer } = req.body;

  let keywords = req.body.keywords;
  if (typeof keywords === 'string') {
    try { keywords = JSON.parse(keywords); } catch { keywords = keywords.split(',').map(k => k.trim()); }
  }

  const files = req.files;
  if (!files || files.length === 0) {
    throw new AppError('At least one image is required', 400);
  }

  // Create listing record
  const listingId = uuidv4();
  listingsRepo.create({
    id: listingId,
    marketplace,
    language: language || 'english',
    voice_profile_id: voice_profile_id || null,
    status: 'generating',
    product_name_hint: product_name_hint || null,
    material: material || null,
    size: size || null,
    price: price || null,
    target_buyer: target_buyer || null,
    keywords: JSON.stringify(keywords || []),
  });

  // Save image records
  const imagePaths = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const imageId = uuidv4();
    listingsRepo.addImage({
      id: imageId,
      listing_id: listingId,
      original_filename: file.originalname,
      stored_filename: file.filename,
      mime_type: file.mimetype,
      width: null,
      height: null,
      size_bytes: file.size,
      sort_order: i,
    });
    imagePaths.push(path.resolve(env.UPLOAD_DIR, file.filename));
  }

  // Start generation (async, don't await for response)
  res.status(201).json({
    success: true,
    data: { id: listingId, status: 'generating' },
    error: null,
  });

  // Run pipeline in background
  try {
    // 1. Resize images
    const resizedPaths = await imageService.processImages(imagePaths);

    // 2. Vision step
    const productAnalysis = await visionService.analyzeImages(resizedPaths);

    // 3. Get voice profile
    let voiceProfile = null;
    if (voice_profile_id) {
      voiceProfile = voiceProfilesRepo.getById(voice_profile_id);
    }

    // 4. Writer step
    const rawListing = await writerService.generateListing({
      marketplace,
      language: language || 'english',
      productAnalysis,
      sellerInputs: { product_name_hint, material, size, price, target_buyer, keywords },
      voiceProfile,
      imageCount: files.length,
    });

    // 5. Validate
    const { listing: validated, warnings } = validatorService.validateListing(rawListing, marketplace);

    // 6. Save result
    listingsRepo.updateGenerated(listingId, {
      status: 'done',
      product_analysis: JSON.stringify(productAnalysis),
      title: validated.title,
      bullets: JSON.stringify(validated.bullets || []),
      description: validated.description,
      tags: JSON.stringify(validated.tags || []),
      backend_search_terms: validated.backend_search_terms || '',
      materials_field: validated.materials_field || '',
      attributes: JSON.stringify(validated.attributes || {}),
      alt_texts: JSON.stringify(validated.alt_texts || []),
    });

    logger.info({ listingId, marketplace, warnings: warnings.length }, 'Listing generation complete');
  } catch (err) {
    logger.error({ error: err.message, listingId }, 'Listing generation failed');
    listingsRepo.updateStatus(listingId, 'error', err.message);
  }
});

/**
 * GET /api/listings
 */
const getListings = asyncHandler(async (req, res) => {
  const { marketplace, status, limit = '50', offset = '0' } = req.query;
  const listings = listingsRepo.getAll({
    marketplace,
    status,
    limit: parseInt(limit),
    offset: parseInt(offset),
  });
  const total = listingsRepo.getCount({ marketplace, status });

  res.json({
    success: true,
    data: { listings, total, limit: parseInt(limit), offset: parseInt(offset) },
    error: null,
  });
});

/**
 * GET /api/listings/:id
 */
const getListing = asyncHandler(async (req, res) => {
  const listing = listingsRepo.getById(req.params.id);
  if (!listing) {
    throw new AppError('Listing not found', 404);
  }

  const images = listingsRepo.getImages(listing.id);

  res.json({
    success: true,
    data: { ...listing, images },
    error: null,
  });
});

/**
 * PATCH /api/listings/:id
 */
const updateListing = asyncHandler(async (req, res) => {
  const listing = listingsRepo.getById(req.params.id);
  if (!listing) {
    throw new AppError('Listing not found', 404);
  }

  const updates = req.body;
  for (const [field, value] of Object.entries(updates)) {
    const storeValue = Array.isArray(value) || typeof value === 'object'
      ? JSON.stringify(value)
      : value;
    listingsRepo.updateField(listing.id, field, storeValue);
  }

  const updated = listingsRepo.getById(listing.id);
  res.json({ success: true, data: updated, error: null });
});

/**
 * POST /api/listings/:id/regenerate
 */
const regenerateField = asyncHandler(async (req, res) => {
  const listing = listingsRepo.getById(req.params.id);
  if (!listing) {
    throw new AppError('Listing not found', 404);
  }

  const { field, instruction } = req.body;

  // Build current listing object
  const currentListing = {
    title: listing.title,
    bullets: listing.bullets ? JSON.parse(listing.bullets) : [],
    description: listing.description,
    tags: listing.tags ? JSON.parse(listing.tags) : [],
    backend_search_terms: listing.backend_search_terms,
    materials_field: listing.materials_field,
    attributes: listing.attributes ? JSON.parse(listing.attributes) : {},
    alt_texts: listing.alt_texts ? JSON.parse(listing.alt_texts) : [],
  };

  const result = await writerService.regenerateField({
    marketplace: listing.marketplace,
    language: listing.language,
    currentListing,
    field,
    instruction,
  });

  // Extract the regenerated value
  const newValue = result[field];
  if (newValue !== undefined) {
    const storeValue = Array.isArray(newValue) || typeof newValue === 'object'
      ? JSON.stringify(newValue)
      : newValue;
    listingsRepo.updateField(listing.id, field, storeValue);
  }

  const updated = listingsRepo.getById(listing.id);
  res.json({ success: true, data: updated, error: null });
});

/**
 * DELETE /api/listings/:id
 */
const deleteListing = asyncHandler(async (req, res) => {
  const listing = listingsRepo.getById(req.params.id);
  if (!listing) {
    throw new AppError('Listing not found', 404);
  }
  listingsRepo.delete(listing.id);
  res.json({ success: true, data: { message: 'Listing deleted' }, error: null });
});

module.exports = {
  createListing,
  getListings,
  getListing,
  updateListing,
  regenerateField,
  deleteListing,
};
