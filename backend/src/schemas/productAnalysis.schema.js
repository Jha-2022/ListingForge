const { z } = require('zod');

const productAnalysisSchema = z.object({
  category: z.string().nullable(),
  colors: z.array(z.string()).nullable(),
  material_guess: z.string().nullable(),
  style: z.string().nullable(),
  occasion: z.string().nullable(),
  notable_features: z.array(z.string()).nullable(),
  uncertainties: z.array(z.string()).nullable(),
  product_type: z.string().nullable(),
  pattern: z.string().nullable(),
  size_estimate: z.string().nullable(),
});

module.exports = { productAnalysisSchema };
