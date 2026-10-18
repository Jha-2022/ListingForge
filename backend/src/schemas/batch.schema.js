const { z } = require('zod');

const createBatchJobSchema = z.object({
  marketplace: z.enum(['etsy', 'amazon', 'meesho']),
  language: z.enum(['english', 'hindi', 'hinglish']).default('english'),
  voice_profile_id: z.string().uuid().nullable().optional(),
});

module.exports = { createBatchJobSchema };
