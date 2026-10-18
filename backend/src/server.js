const app = require('./app');
const { env } = require('./config/env');
const { migrate } = require('./db/migrate');
const { closeDb } = require('./db/database');
const logger = require('./utils/logger');

// Run migrations on startup
try {
  migrate();
} catch (err) {
  logger.error({ error: err.message }, 'Failed to run migrations');
  process.exit(1);
}

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 ListingForge backend listening on http://localhost:${env.PORT}`);
  logger.info(`   Model target: ${env.VLM_MODEL}`);
  logger.info(`   Ollama target: ${env.OLLAMA_BASE_URL}`);
});

function shutdown() {
  logger.info('Shutting down server...');
  server.close(() => {
    closeDb();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
