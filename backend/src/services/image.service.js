const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { env } = require('../config/env');
const logger = require('../utils/logger');

const MAX_DIMENSION = 1024;

/**
 * Resize and compress an image to max 1024px on longest side.
 * Returns the path to the resized image.
 *
 * @param {string} inputPath - absolute path to original image
 * @returns {Promise<string>} path to resized image
 */
async function resizeImage(inputPath) {
  const ext = path.extname(inputPath);
  const basename = path.basename(inputPath, ext);
  const outputPath = path.join(path.dirname(inputPath), `${basename}_resized${ext}`);

  try {
    const metadata = await sharp(inputPath).metadata();

    const needsResize = metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION;

    if (!needsResize) {
      // Still compress even if no resize needed
      await sharp(inputPath)
        .jpeg({ quality: 85 })
        .toFile(outputPath);
    } else {
      await sharp(inputPath)
        .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(outputPath);
    }

    const stats = fs.statSync(outputPath);
    const resizedMeta = await sharp(outputPath).metadata();

    logger.debug({
      original: path.basename(inputPath),
      resized: path.basename(outputPath),
      width: resizedMeta.width,
      height: resizedMeta.height,
      sizeKB: Math.round(stats.size / 1024),
    }, 'Image resized');

    return outputPath;
  } catch (err) {
    logger.error({ error: err.message, inputPath }, 'Failed to resize image');
    // Return original if resize fails
    return inputPath;
  }
}

/**
 * Process multiple images: resize each one.
 * @param {string[]} imagePaths
 * @returns {Promise<string[]>} paths to resized images
 */
async function processImages(imagePaths) {
  const resized = await Promise.all(imagePaths.map(resizeImage));
  return resized;
}

module.exports = { resizeImage, processImages };
