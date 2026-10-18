const fs = require('fs');
const path = require('path');
const { getDb } = require('./database');
const logger = require('../utils/logger');

function migrate() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  const db = getDb();

  logger.info('Running database migrations...');
  db.exec(schema);
  logger.info('Database migrations complete');
}

module.exports = { migrate };
