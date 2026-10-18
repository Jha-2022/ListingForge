const ollamaService = require('./ollama.service');
const { listingOutputSchema } = require('../schemas/listing.schema');
const { getMarketplace } = require('../config/marketplaces');
const { retryJson } = require('../utils/retryJson');
const { fillPrompt } = require('../utils/promptLoader');
const logger = require('../utils/logger');

/**
 * Generate a marketplace listing from product analysis and seller inputs.
 *
 * @param {object} options
 * @param {string} options.marketplace - 'etsy' | 'amazon' | 'meesho'
 * @param {string} options.language - 'english' | 'hindi' | 'hinglish'
 * @param {object} options.productAnalysis - vision step output
 * @param {object} options.sellerInputs - user-provided hints
 * @param {object|null} options.voiceProfile - voice profile data or null
 * @param {number} options.imageCount - number of images for alt text count
 * @returns {Promise<object>} validated listing output
 */
async function generateListing({
  marketplace,
  language,
  productAnalysis,
  sellerInputs,
  voiceProfile,
  imageCount,
}) {
  logger.info({ marketplace, language }, 'Starting listing generation');

  const mpConfig = getMarketplace(marketplace);
  const templateFile = `writer.${marketplace}.txt`;

  // Build voice profile text
  let voiceText = 'No specific voice profile selected. Use a professional, helpful tone.';
  if (voiceProfile) {
    if (voiceProfile.style_description) {
      voiceText = `Style: ${voiceProfile.style_description}`;
    }
    const samples = voiceProfile.sample_listings
      ? JSON.parse(voiceProfile.sample_listings)
      : [];
    if (samples.length > 0) {
      voiceText += '\n\nSample listings for tone reference:\n' +
        samples.map((s, i) => `--- Sample ${i + 1} ---\n${s}`).join('\n\n');
    }
  }

  const promptVars = {
    product_analysis: JSON.stringify(productAnalysis, null, 2),
    product_name_hint: sellerInputs.product_name_hint || 'Not provided',
    material: sellerInputs.material || 'Not provided',
    size: sellerInputs.size || 'Not provided',
    price: sellerInputs.price || 'Not provided',
    target_buyer: sellerInputs.target_buyer || 'Not provided',
    keywords: (sellerInputs.keywords || []).join(', ') || 'Not provided',
    language: language,
    voice_profile: voiceText,
  };

  const systemPrompt = fillPrompt(templateFile, promptVars);

  const callFn = async () => {
    const response = await ollamaService.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Generate a complete ${mpConfig.name} listing for this product. Return ONLY valid JSON with the required fields. Generate ${imageCount} alt text(s), one per image.`,
        },
      ],
      temperature: 0.7,
    });
    return response;
  };

  const retryCallFn = async (errorFeedback) => {
    const response = await ollamaService.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Generate a complete ${mpConfig.name} listing for this product. Return ONLY valid JSON.`,
        },
        { role: 'user', content: errorFeedback },
      ],
      temperature: 0.7,
    });
    return response;
  };

  const result = await retryJson({
    callFn,
    schema: listingOutputSchema,
    retryCallFn,
    maxRetries: 2,
  });

  logger.info({ marketplace, titleLength: result.title?.length }, 'Listing generation complete');
  return result;
}

/**
 * Regenerate a single field of an existing listing.
 */
async function regenerateField({
  marketplace,
  language,
  currentListing,
  field,
  instruction,
}) {
  logger.info({ marketplace, field, instruction }, 'Regenerating field');

  const mpConfig = getMarketplace(marketplace);

  // Build marketplace rules text
  const rulesText = [
    `Marketplace: ${mpConfig.name}`,
    `Title max chars: ${mpConfig.titleMaxChars}`,
    mpConfig.bulletCount ? `Bullets: ${mpConfig.bulletCount}, each max ${mpConfig.bulletMaxChars} chars` : '',
    mpConfig.tagCount ? `Tags: exactly ${mpConfig.tagCount}, each max ${mpConfig.tagMaxChars} chars` : '',
    `Emojis allowed: ${mpConfig.allowEmojis}`,
  ].filter(Boolean).join('\n');

  const promptVars = {
    current_listing: JSON.stringify(currentListing, null, 2),
    marketplace: mpConfig.name,
    language,
    field,
    instruction,
    marketplace_rules: rulesText,
  };

  const systemPrompt = fillPrompt('regenerate.txt', promptVars);

  const callFn = async () => {
    const response = await ollamaService.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Regenerate the "${field}" field following my instruction: "${instruction}". Return ONLY valid JSON.`,
        },
      ],
      temperature: 0.7,
    });
    return response;
  };

  // For regeneration, we parse the result more loosely
  const raw = await callFn();
  let jsonStr = raw;
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);
  return parsed;
}

module.exports = { generateListing, regenerateField };
