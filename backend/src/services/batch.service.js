const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const { parse } = require('csv-parse/sync');
const { v4: uuidv4 } = require('uuid');
const { env } = require('../config/env');
const batchRepo = require('../repositories/batch.repo');
const listingsRepo = require('../repositories/listings.repo');
const imageService = require('./image.service');
const visionService = require('./vision.service');
const writerService = require('./writer.service');
const validatorService = require('./validator.service');
const { sseBroadcaster } = require('./sse.service');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

let isProcessing = false;
const queue = [];

/**
 * Create a batch job from uploaded ZIP and optional CSV.
 */
async function createBatchJob({ marketplace, language, voiceProfileId, zipPath, csvPath }) {
  const jobId = uuidv4();

  // Extract ZIP
  let zip;
  try {
    zip = new AdmZip(zipPath);
  } catch (err) {
    throw new AppError('Invalid or corrupt ZIP file', 400);
  }

  const zipEntries = zip.getEntries();
  const extractDir = path.join(path.resolve(env.UPLOAD_DIR), `batch-${jobId}`);
  zip.extractAllTo(extractDir, true);

  // Parse CSV or auto-detect folders
  let items = [];

  if (csvPath) {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    let records;
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err) {
      throw new AppError(`Malformed CSV: ${err.message}`, 400);
    }

    items = records.map((row, idx) => ({
      id: uuidv4(),
      product_id: row.product_id || `product-${idx + 1}`,
      image_filenames: row.image_filenames ? row.image_filenames.split(',').map((f) => f.trim()) : [],
      name_hint: row.name_hint || null,
      price: row.price || null,
      keywords: row.keywords ? row.keywords.split(',').map((k) => k.trim()) : [],
      sort_order: idx,
    }));
  } else {
    // Auto-detect: each subfolder is one product
    const subfolders = fs.readdirSync(extractDir).filter((f) =>
      fs.statSync(path.join(extractDir, f)).isDirectory()
    );

    if (subfolders.length === 0) {
      // Maybe images are at root level
      const images = fs.readdirSync(extractDir).filter((f) =>
        /\.(jpe?g|png|webp|gif)$/i.test(f)
      );
      if (images.length > 0) {
        items.push({
          id: uuidv4(),
          product_id: 'product-1',
          image_filenames: images,
          name_hint: null,
          price: null,
          keywords: [],
          sort_order: 0,
        });
      }
    } else {
      items = subfolders.map((folder, idx) => {
        const folderPath = path.join(extractDir, folder);
        const images = fs.readdirSync(folderPath).filter((f) =>
          /\.(jpe?g|png|webp|gif)$/i.test(f)
        );
        return {
          id: uuidv4(),
          product_id: folder,
          image_filenames: images.map((img) => `${folder}/${img}`),
          name_hint: folder.replace(/[-_]/g, ' '),
          price: null,
          keywords: [],
          sort_order: idx,
        };
      });
    }
  }

  if (items.length === 0) {
    throw new AppError('No products found in the uploaded files', 400);
  }

  // Create batch job in DB
  batchRepo.createJob({
    id: jobId,
    marketplace,
    language,
    voice_profile_id: voiceProfileId || null,
    total_items: items.length,
  });

  // Create batch items
  for (const item of items) {
    batchRepo.createItem({
      id: item.id,
      batch_job_id: jobId,
      product_id: item.product_id,
      image_filenames: JSON.stringify(item.image_filenames),
      name_hint: item.name_hint,
      price: item.price,
      keywords: JSON.stringify(item.keywords),
      sort_order: item.sort_order,
    });
  }

  // Queue the job for processing
  queue.push({ jobId, extractDir });
  processQueue();

  return { jobId, totalItems: items.length };
}

/**
 * Process the batch queue, one item at a time.
 */
async function processQueue() {
  if (isProcessing || queue.length === 0) return;

  isProcessing = true;
  const { jobId, extractDir } = queue.shift();

  try {
    batchRepo.updateJobStatus(jobId, 'processing');
    sseBroadcaster.broadcast(`batch-${jobId}`, 'status', { status: 'processing' });

    const job = batchRepo.getJob(jobId);
    const items = batchRepo.getJobItems(jobId);

    for (const item of items) {
      try {
        batchRepo.updateItemStatus(item.id, 'processing');
        sseBroadcaster.broadcast(`batch-${jobId}`, 'item_status', {
          itemId: item.id,
          productId: item.product_id,
          status: 'processing',
        });

        // Resolve image paths
        const imageFilenames = JSON.parse(item.image_filenames);
        const imagePaths = imageFilenames.map((f) => path.join(extractDir, f));
        const validPaths = imagePaths.filter((p) => fs.existsSync(p));

        if (validPaths.length === 0) {
          throw new Error(`No valid images found for product ${item.product_id}`);
        }

        // Resize images
        const resizedPaths = await imageService.processImages(validPaths);

        // Create listing record
        const listingId = uuidv4();
        const keywords = item.keywords ? JSON.parse(item.keywords) : [];

        listingsRepo.create({
          id: listingId,
          marketplace: job.marketplace,
          language: job.language,
          voice_profile_id: job.voice_profile_id,
          status: 'generating',
          product_name_hint: item.name_hint,
          price: item.price,
          keywords: JSON.stringify(keywords),
          batch_job_id: jobId,
          batch_item_id: item.id,
        });

        // Save image records
        for (let i = 0; i < validPaths.length; i++) {
          const storedFilename = path.basename(validPaths[i]);
          listingsRepo.addImage({
            id: uuidv4(),
            listing_id: listingId,
            original_filename: imageFilenames[i],
            stored_filename: storedFilename,
            mime_type: 'image/jpeg',
            sort_order: i,
          });
        }

        // Vision step
        const productAnalysis = await visionService.analyzeImages(resizedPaths);

        // Writer step
        let voiceProfile = null;
        if (job.voice_profile_id) {
          const { getDb } = require('../db/database');
          const db = getDb();
          voiceProfile = db.prepare('SELECT * FROM voice_profiles WHERE id = ?').get(job.voice_profile_id);
        }

        const rawListing = await writerService.generateListing({
          marketplace: job.marketplace,
          language: job.language,
          productAnalysis,
          sellerInputs: {
            product_name_hint: item.name_hint,
            price: item.price,
            keywords,
          },
          voiceProfile,
          imageCount: validPaths.length,
        });

        // Validate
        const { listing: validated, warnings } = validatorService.validateListing(rawListing, job.marketplace);

        // Update listing
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

        // Update batch item
        batchRepo.updateItemStatus(item.id, 'done');
        batchRepo.linkItemListing(item.id, listingId);
        batchRepo.incrementCompleted(jobId);

        sseBroadcaster.broadcast(`batch-${jobId}`, 'item_status', {
          itemId: item.id,
          productId: item.product_id,
          status: 'done',
          listingId,
          warnings,
        });
      } catch (err) {
        logger.error({ error: err.message, itemId: item.id }, 'Batch item failed');
        batchRepo.updateItemStatus(item.id, 'failed', err.message);
        batchRepo.incrementFailed(jobId);

        sseBroadcaster.broadcast(`batch-${jobId}`, 'item_status', {
          itemId: item.id,
          productId: item.product_id,
          status: 'failed',
          error: err.message,
        });
      }
    }

    // Finalize job
    const finalJob = batchRepo.getJob(jobId);
    const finalStatus = finalJob.failed_items === finalJob.total_items ? 'failed' : 'done';
    batchRepo.updateJobStatus(jobId, finalStatus);

    sseBroadcaster.broadcast(`batch-${jobId}`, 'status', {
      status: finalStatus,
      completed: finalJob.completed_items,
      failed: finalJob.failed_items,
      total: finalJob.total_items,
    });
  } catch (err) {
    logger.error({ error: err.message, jobId }, 'Batch job failed');
    batchRepo.updateJobStatus(jobId, 'failed', err.message);
    sseBroadcaster.broadcast(`batch-${jobId}`, 'status', {
      status: 'failed',
      error: err.message,
    });
  } finally {
    isProcessing = false;
    processQueue(); // Process next in queue
  }
}

/**
 * Retry a failed batch item.
 */
async function retryItem(jobId, itemId) {
  const item = batchRepo.getItem(itemId);
  if (!item || item.batch_job_id !== jobId) {
    throw new AppError('Batch item not found', 404);
  }
  if (item.status !== 'failed') {
    throw new AppError('Only failed items can be retried', 400);
  }

  batchRepo.updateItemStatus(itemId, 'queued');

  // Re-queue the job
  const job = batchRepo.getJob(jobId);
  const extractDir = path.join(path.resolve(env.UPLOAD_DIR), `batch-${jobId}`);
  queue.push({ jobId, extractDir });
  processQueue();

  return { message: 'Item queued for retry' };
}

module.exports = { createBatchJob, retryItem };
