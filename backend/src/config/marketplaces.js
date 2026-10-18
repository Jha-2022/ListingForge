/**
 * Marketplace rules and limits for Etsy, Amazon India, and Meesho.
 * All listing generation and validation references this config.
 */

const marketplaces = {
  etsy: {
    name: 'Etsy',
    titleMaxChars: 140,
    tagCount: 13,
    tagMaxChars: 20,
    descriptionStyle: 'story-driven',
    hasMaterialsField: true,
    hasBackendSearchTerms: false,
    bulletCount: 0, // Etsy uses description paragraphs, not bullets
    allowEmojis: true,
    bannedClaims: [
      '100% genuine', 'best in india', 'best quality', 'guaranteed results',
      'medical grade', 'cures', 'treats', 'heals', 'FDA approved',
      'clinically proven', 'doctor recommended',
    ],
    fields: ['title', 'description', 'tags', 'materials_field', 'alt_texts'],
    csvHeaders: ['title', 'description', 'tags', 'materials', 'alt_text_1', 'alt_text_2', 'alt_text_3', 'alt_text_4', 'alt_text_5'],
  },

  amazon: {
    name: 'Amazon India',
    titleMaxChars: 200,
    tagCount: 0, // Amazon uses backend search terms instead
    tagMaxChars: 0,
    descriptionStyle: 'plain-text',
    hasMaterialsField: false,
    hasBackendSearchTerms: true,
    backendSearchTermsMaxChars: 250,
    bulletCount: 5,
    bulletMaxChars: 500,
    bulletStyle: 'CAPITALIZED benefit phrase first',
    allowEmojis: false,
    bannedClaims: [
      '100% genuine', 'best in india', '#1', 'number one', 'top rated',
      'best seller', 'guaranteed', 'risk-free', 'no side effects',
      'medical grade', 'cures', 'treats', 'heals', 'FDA approved',
      'clinically proven', 'doctor recommended',
    ],
    fields: ['title', 'bullets', 'description', 'backend_search_terms', 'alt_texts'],
    csvHeaders: ['title', 'bullet_1', 'bullet_2', 'bullet_3', 'bullet_4', 'bullet_5', 'description', 'search_terms', 'alt_text_1', 'alt_text_2', 'alt_text_3', 'alt_text_4', 'alt_text_5'],
  },

  meesho: {
    name: 'Meesho',
    titleMaxChars: 100,
    tagCount: 0,
    tagMaxChars: 0,
    descriptionStyle: 'short-hinglish',
    hasMaterialsField: false,
    hasBackendSearchTerms: false,
    bulletCount: 5,
    bulletMaxChars: 200,
    bulletStyle: 'simple, Hinglish-friendly',
    allowEmojis: true,
    hasAttributes: true,
    attributeFields: ['fabric', 'color', 'size', 'care'],
    bannedClaims: [
      '100% genuine', 'best in india', 'guaranteed results', 'lowest price',
      'cheapest', 'free delivery', 'cash on delivery', 'COD available',
      'medical grade', 'cures', 'treats', 'heals',
    ],
    fields: ['title', 'bullets', 'description', 'attributes', 'alt_texts'],
    csvHeaders: ['title', 'bullet_1', 'bullet_2', 'bullet_3', 'bullet_4', 'bullet_5', 'description', 'fabric', 'color', 'size', 'care', 'alt_text_1', 'alt_text_2', 'alt_text_3', 'alt_text_4', 'alt_text_5'],
  },
};

/**
 * Get marketplace config by key
 * @param {string} key - 'etsy' | 'amazon' | 'meesho'
 * @returns {object}
 */
function getMarketplace(key) {
  const mp = marketplaces[key];
  if (!mp) {
    throw new Error(`Unknown marketplace: ${key}. Supported: ${Object.keys(marketplaces).join(', ')}`);
  }
  return mp;
}

/**
 * Get all marketplace keys
 * @returns {string[]}
 */
function getMarketplaceKeys() {
  return Object.keys(marketplaces);
}

module.exports = { marketplaces, getMarketplace, getMarketplaceKeys };
