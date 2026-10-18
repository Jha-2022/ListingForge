const Database = require('better-sqlite3');
const path = require('path');
const { env } = require('../config/env');
const logger = require('../utils/logger');

let db = null;

function getDb() {
  if (db) return db;

  const dbPath = path.resolve(env.DB_PATH);
  logger.info({ dbPath }, 'Opening SQLite database');

  db = new Database(dbPath);

  // Performance pragmas
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000'); // 64MB

  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
    logger.info('Database connection closed');
  }
}

module.exports = { getDb, closeDb };
