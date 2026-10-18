-- ListingForge Database Schema

CREATE TABLE IF NOT EXISTS voice_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  style_description TEXT,
  sample_listings TEXT, -- JSON array of sample listing strings
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  marketplace TEXT NOT NULL CHECK(marketplace IN ('etsy', 'amazon', 'meesho')),
  language TEXT NOT NULL DEFAULT 'english' CHECK(language IN ('english', 'hindi', 'hinglish')),
  voice_profile_id TEXT REFERENCES voice_profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'generating', 'done', 'error')),

  -- Seller inputs
  product_name_hint TEXT,
  material TEXT,
  size TEXT,
  price TEXT,
  target_buyer TEXT,
  keywords TEXT, -- JSON array

  -- Vision step output
  product_analysis TEXT, -- JSON object

  -- Generated listing fields
  title TEXT,
  bullets TEXT, -- JSON array
  description TEXT,
  tags TEXT, -- JSON array
  backend_search_terms TEXT,
  materials_field TEXT,
  attributes TEXT, -- JSON object (Meesho)
  alt_texts TEXT, -- JSON array, one per image

  -- Metadata
  error_message TEXT,
  batch_job_id TEXT REFERENCES batch_jobs(id) ON DELETE SET NULL,
  batch_item_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS listing_images (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  size_bytes INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS batch_jobs (
  id TEXT PRIMARY KEY,
  marketplace TEXT NOT NULL CHECK(marketplace IN ('etsy', 'amazon', 'meesho')),
  language TEXT NOT NULL DEFAULT 'english',
  voice_profile_id TEXT REFERENCES voice_profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'done', 'failed')),
  total_items INTEGER NOT NULL DEFAULT 0,
  completed_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS batch_items (
  id TEXT PRIMARY KEY,
  batch_job_id TEXT NOT NULL REFERENCES batch_jobs(id) ON DELETE CASCADE,
  listing_id TEXT REFERENCES listings(id) ON DELETE SET NULL,
  product_id TEXT,
  image_filenames TEXT, -- JSON array
  name_hint TEXT,
  price TEXT,
  keywords TEXT, -- JSON array
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued', 'processing', 'done', 'failed')),
  error_message TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_listings_marketplace ON listings(marketplace);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_batch_job_id ON listings(batch_job_id);
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_batch_items_batch_job_id ON batch_items(batch_job_id);
