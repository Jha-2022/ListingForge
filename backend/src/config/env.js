const dotenv = require('dotenv');
const { z } = require('zod');
const path = require('path');

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  VLM_MODEL: z.string().default('qwen2.5vl:7b'),
  DB_PATH: z.string().default('./data/listingforge.db'),
  UPLOAD_DIR: z.string().default('./uploads'),
  LICENSE_SECRET: z.string().default('listingforge-dev-secret'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  MAX_FILES_PER_LISTING: z.coerce.number().default(5),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = Object.freeze(parsed.data);

module.exports = { env };
