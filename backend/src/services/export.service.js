const { stringify } = require('csv-stringify/sync');
const { getMarketplace } = require('../config/marketplaces');
const logger = require('../utils/logger');

/**
 * Export listings as marketplace-formatted CSV.
 *
 * @param {object[]} listings - array of listing objects
 * @param {string} marketplaceKey
 * @returns {string} CSV string
 */
function exportToCsv(listings, marketplaceKey) {
  const mp = getMarketplace(marketplaceKey);
  const headers = mp.csvHeaders;

  const rows = listings.map((listing) => {
    const row = {};

    row.title = listing.title || '';
    row.description = listing.description || '';

    // Bullets
    const bullets = listing.bullets ? JSON.parse(listing.bullets) : [];
    for (let i = 0; i < 5; i++) {
      row[`bullet_${i + 1}`] = bullets[i] || '';
    }

    // Tags
    if (mp.tagCount > 0) {
      const tags = listing.tags ? JSON.parse(listing.tags) : [];
      row.tags = tags.join(', ');
    }

    // Backend search terms
    if (mp.hasBackendSearchTerms) {
      row.search_terms = listing.backend_search_terms || '';
    }

    // Materials
    if (mp.hasMaterialsField) {
      row.materials = listing.materials_field || '';
    }

    // Attributes (Meesho)
    if (mp.hasAttributes) {
      const attrs = listing.attributes ? JSON.parse(listing.attributes) : {};
      for (const field of mp.attributeFields) {
        row[field] = attrs[field] || '';
      }
    }

    // Alt texts
    const altTexts = listing.alt_texts ? JSON.parse(listing.alt_texts) : [];
    for (let i = 0; i < 5; i++) {
      row[`alt_text_${i + 1}`] = altTexts[i] || '';
    }

    return row;
  });

  const csv = stringify(rows, {
    header: true,
    columns: headers.map((h) => ({ key: h, header: h })),
  });

  logger.info({ marketplace: marketplaceKey, count: listings.length }, 'CSV export generated');
  return csv;
}

/**
 * Export listings as JSON.
 *
 * @param {object[]} listings
 * @returns {string} JSON string
 */
function exportToJson(listings) {
  const formatted = listings.map((listing) => ({
    id: listing.id,
    marketplace: listing.marketplace,
    title: listing.title,
    bullets: listing.bullets ? JSON.parse(listing.bullets) : [],
    description: listing.description,
    tags: listing.tags ? JSON.parse(listing.tags) : [],
    backend_search_terms: listing.backend_search_terms,
    materials_field: listing.materials_field,
    attributes: listing.attributes ? JSON.parse(listing.attributes) : {},
    alt_texts: listing.alt_texts ? JSON.parse(listing.alt_texts) : [],
    created_at: listing.created_at,
  }));

  return JSON.stringify(formatted, null, 2);
}

module.exports = { exportToCsv, exportToJson };
