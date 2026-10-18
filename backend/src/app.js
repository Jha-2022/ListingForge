const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { env } = require('./config/env');
const logger = require('./utils/logger');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const listingsRoutes = require('./routes/listings.routes');
const voiceProfilesRoutes = require('./routes/voiceProfiles.routes');
const batchRoutes = require('./routes/batch.routes');
const exportRoutes = require('./routes/export.routes');
const healthRoutes = require('./routes/health.routes');
const licenseRoutes = require('./routes/license.routes');

const app = express();

// Ensure upload & data directories exist
const uploadDir = path.resolve(env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const dbDir = path.dirname(path.resolve(env.DB_PATH));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Global middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded assets
app.use('/uploads', express.static(uploadDir));

// API routes
app.use('/api/listings', listingsRoutes);
app.use('/api/voice-profiles', voiceProfilesRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/license', licenseRoutes);

// Root & fallback
app.get('/', (_req, res) => {
  res.json({
    name: 'ListingForge API',
    status: 'running',
    docs: '/api/health',
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
