const { z } = require('zod');

const createListingSchema = z.object({
  marketplace: z.enum(['etsy', 'amazon', 'meesho']),
  language: z.enum(['english', 'hindi', 'hinglish']).default('english'),
  voice_profile_id: z.string().uuid().nullable().optional(),
  product_name_hint: z.string().max(200).optional(),
  material: z.string().max(200).optional(),
  size: z.string().max(100).optional(),
  price: z.string().max(50).optional(),
  target_buyer: z.string().max(200).optional(),
  keywords: z.array(z.string().max(50)).min(0).max(10).optional(),
});

const regenerateFieldSchema = z.object({
  field: z.enum(['title', 'bullets', 'description', 'tags', 'backend_search_terms', 'materials_field', 'attributes', 'alt_texts']),
  instruction: z.string().min(1).max(500),
});

const updateListingSchema = z.object({
  title: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  backend_search_terms: z.string().optional(),
  materials_field: z.string().optional(),
  attributes: z.record(z.string()).optional(),
  alt_texts: z.array(z.string()).optional(),
});

// Schema for the writer model output — listing fields
const listingOutputSchema = z.object({
  title: z.string(),
  bullets: z.array(z.string()).optional().default([]),
  description: z.string(),
  tags: z.array(z.string()).optional().default([]),
  backend_search_terms: z.string().optional().default(''),
  materials_field: z.string().optional().default(''),
  attributes: z.record(z.string()).optional().default({}),
  alt_texts: z.array(z.string()).optional().default([]),
});

module.exports = {
  createListingSchema,
  regenerateFieldSchema,
  updateListingSchema,
  listingOutputSchema,
};
