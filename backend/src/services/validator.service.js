const { getMarketplace } = require('../config/marketplaces');
const logger = require('../utils/logger');

/**
 * Validate and clean a listing against marketplace rules.
 * Enforces char limits, dedupes tags, strips banned claims, removes emojis if needed.
 *
 * @param {object} listing - the generated listing data
 * @param {string} marketplaceKey - 'etsy' | 'amazon' | 'meesho'
 * @returns {{ listing: object, warnings: string[] }}
 */
function validateListing(listing, marketplaceKey) {
  const mp = getMarketplace(marketplaceKey);
  const warnings = [];
  const cleaned = { ...listing };

  // 1. Title length
  if (cleaned.title && cleaned.title.length > mp.titleMaxChars) {
    warnings.push(`Title exceeds ${mp.titleMaxChars} chars (${cleaned.title.length}). Truncated.`);
    cleaned.title = cleaned.title.substring(0, mp.titleMaxChars);
  }

  // 2. Emojis — strip for Amazon
  if (!mp.allowEmojis) {
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/gu;

    if (cleaned.title) cleaned.title = cleaned.title.replace(emojiRegex, '').trim();
    if (cleaned.description) cleaned.description = cleaned.description.replace(emojiRegex, '').trim();
    if (cleaned.bullets) {
      cleaned.bullets = cleaned.bullets.map((b) => b.replace(emojiRegex, '').trim());
    }
    if (cleaned.backend_search_terms) {
      cleaned.backend_search_terms = cleaned.backend_search_terms.replace(emojiRegex, '').trim();
    }
  }

  // 3. Tags — dedupe and enforce limits (Etsy)
  if (mp.tagCount > 0 && cleaned.tags) {
    // Dedupe (case-insensitive)
    const seen = new Set();
    cleaned.tags = cleaned.tags.filter((tag) => {
      const lower = tag.toLowerCase().trim();
      if (seen.has(lower) || lower === '') return false;
      seen.add(lower);
      return true;
    });

    // Enforce tag max chars
    cleaned.tags = cleaned.tags.map((tag) => {
      if (tag.length > mp.tagMaxChars) {
        warnings.push(`Tag "${tag}" exceeds ${mp.tagMaxChars} chars. Truncated.`);
        return tag.substring(0, mp.tagMaxChars);
      }
      return tag;
    });

    // Enforce exact tag count
    if (cleaned.tags.length > mp.tagCount) {
      warnings.push(`Too many tags (${cleaned.tags.length}). Trimmed to ${mp.tagCount}.`);
      cleaned.tags = cleaned.tags.slice(0, mp.tagCount);
    } else if (cleaned.tags.length < mp.tagCount) {
      warnings.push(`Only ${cleaned.tags.length} tags generated, need ${mp.tagCount}.`);
    }
  }

  // 4. Bullets — enforce count and char limits
  if (mp.bulletCount > 0 && cleaned.bullets) {
    cleaned.bullets = cleaned.bullets.map((bullet, i) => {
      if (bullet.length > mp.bulletMaxChars) {
        warnings.push(`Bullet ${i + 1} exceeds ${mp.bulletMaxChars} chars. Truncated.`);
        return bullet.substring(0, mp.bulletMaxChars);
      }
      return bullet;
    });

    if (cleaned.bullets.length > mp.bulletCount) {
      cleaned.bullets = cleaned.bullets.slice(0, mp.bulletCount);
    }
  }

  // 5. Backend search terms length (Amazon)
  if (mp.hasBackendSearchTerms && cleaned.backend_search_terms) {
    if (cleaned.backend_search_terms.length > mp.backendSearchTermsMaxChars) {
      warnings.push(`Backend search terms exceed ${mp.backendSearchTermsMaxChars} chars. Truncated.`);
      cleaned.backend_search_terms = cleaned.backend_search_terms.substring(0, mp.backendSearchTermsMaxChars);
    }
  }

  // 6. Banned claims
  const allText = [
    cleaned.title,
    cleaned.description,
    ...(cleaned.bullets || []),
  ].filter(Boolean).join(' ').toLowerCase();

  for (const claim of mp.bannedClaims) {
    if (allText.includes(claim.toLowerCase())) {
      warnings.push(`Banned claim detected: "${claim}". Please review and remove manually.`);
    }
  }

  logger.info({ marketplace: marketplaceKey, warningCount: warnings.length }, 'Listing validation complete');
  return { listing: cleaned, warnings };
}

module.exports = { validateListing };
