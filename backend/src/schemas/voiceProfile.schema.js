const { z } = require('zod');

const createVoiceProfileSchema = z.object({
  name: z.string().min(1).max(100),
  style_description: z.string().max(1000).optional(),
  sample_listings: z.array(z.string().min(10).max(5000)).min(0).max(3).optional(),
});

const updateVoiceProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  style_description: z.string().max(1000).optional(),
  sample_listings: z.array(z.string().min(10).max(5000)).min(0).max(3).optional(),
});

module.exports = { createVoiceProfileSchema, updateVoiceProfileSchema };
