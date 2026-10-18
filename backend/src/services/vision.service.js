const fs = require('fs');
const path = require('path');
const ollamaService = require('./ollama.service');
const { productAnalysisSchema } = require('../schemas/productAnalysis.schema');
const { retryJson } = require('../utils/retryJson');
const { loadPrompt } = require('../utils/promptLoader');
const logger = require('../utils/logger');

/**
 * Analyze product images using the vision-language model.
 * Returns structured product analysis JSON.
 *
 * @param {string[]} imagePaths - absolute paths to resized images
 * @returns {Promise<object>} validated product analysis
 */
async function analyzeImages(imagePaths) {
  logger.info({ imageCount: imagePaths.length }, 'Starting vision analysis');

  // Convert images to base64
  const imageBase64 = imagePaths.map((imgPath) => {
    const buffer = fs.readFileSync(imgPath);
    return buffer.toString('base64');
  });

  const systemPrompt = loadPrompt('vision.system.txt');

  const callFn = async () => {
    const response = await ollamaService.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: 'Analyze these product images and return the structured JSON.',
          images: imageBase64,
        },
      ],
      format: {
        type: 'object',
        properties: {
          category: { type: ['string', 'null'] },
          colors: { type: ['array', 'null'], items: { type: 'string' } },
          material_guess: { type: ['string', 'null'] },
          style: { type: ['string', 'null'] },
          occasion: { type: ['string', 'null'] },
          notable_features: { type: ['array', 'null'], items: { type: 'string' } },
          uncertainties: { type: ['array', 'null'], items: { type: 'string' } },
          product_type: { type: ['string', 'null'] },
          pattern: { type: ['string', 'null'] },
          size_estimate: { type: ['string', 'null'] },
        },
        required: ['category', 'colors', 'material_guess', 'style', 'occasion', 'notable_features', 'uncertainties'],
      },
      temperature: 0.3,
    });
    return response;
  };

  const retryCallFn = async (errorFeedback) => {
    const response = await ollamaService.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: 'Analyze these product images and return the structured JSON.',
          images: imageBase64,
        },
        {
          role: 'user',
          content: errorFeedback,
        },
      ],
      format: {
        type: 'object',
        properties: {
          category: { type: ['string', 'null'] },
          colors: { type: ['array', 'null'], items: { type: 'string' } },
          material_guess: { type: ['string', 'null'] },
          style: { type: ['string', 'null'] },
          occasion: { type: ['string', 'null'] },
          notable_features: { type: ['array', 'null'], items: { type: 'string' } },
          uncertainties: { type: ['array', 'null'], items: { type: 'string' } },
          product_type: { type: ['string', 'null'] },
          pattern: { type: ['string', 'null'] },
          size_estimate: { type: ['string', 'null'] },
        },
        required: ['category', 'colors', 'material_guess', 'style', 'occasion', 'notable_features', 'uncertainties'],
      },
      temperature: 0.3,
    });
    return response;
  };

  const result = await retryJson({
    callFn,
    schema: productAnalysisSchema,
    retryCallFn,
    maxRetries: 2,
  });

  logger.info({ category: result.category, productType: result.product_type }, 'Vision analysis complete');
  return result;
}

module.exports = { analyzeImages };
