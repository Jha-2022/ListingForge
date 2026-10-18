const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { env } = require('../config/env');
const AppError = require('../utils/AppError');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = env.MAX_FILE_SIZE_MB * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(env.UPLOAD_DIR));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(
      `Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      400
    ));
  }
};

const uploadImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: env.MAX_FILES_PER_LISTING,
  },
}).array('images', env.MAX_FILES_PER_LISTING);

const uploadBatch = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.resolve(env.UPLOAD_DIR));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `batch-${uuidv4()}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.zip' || ext === '.csv' || ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`Unsupported file type: ${file.originalname}`, 400));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB for batch uploads
    files: 2, // ZIP + CSV
  },
}).fields([
  { name: 'zip', maxCount: 1 },
  { name: 'csv', maxCount: 1 },
]);

module.exports = { uploadImages, uploadBatch };
