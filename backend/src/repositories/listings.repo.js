const { getDb } = require('../db/database');

const listingsRepo = {
  create(data) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO listings (id, marketplace, language, voice_profile_id, status,
        product_name_hint, material, size, price, target_buyer, keywords,
        batch_job_id, batch_item_id)
      VALUES (@id, @marketplace, @language, @voice_profile_id, @status,
        @product_name_hint, @material, @size, @price, @target_buyer, @keywords,
        @batch_job_id, @batch_item_id)
    `);
    return stmt.run({
      id: data.id,
      marketplace: data.marketplace,
      language: data.language || 'english',
      voice_profile_id: data.voice_profile_id || null,
      status: data.status || 'draft',
      product_name_hint: data.product_name_hint || null,
      material: data.material || null,
      size: data.size || null,
      price: data.price || null,
      target_buyer: data.target_buyer || null,
      keywords: data.keywords || null,
      batch_job_id: data.batch_job_id || null,
      batch_item_id: data.batch_item_id || null,
    });
  },

  getById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM listings WHERE id = ?').get(id);
  },

  getAll({ marketplace, status, limit = 50, offset = 0 } = {}) {
    const db = getDb();
    let query = 'SELECT * FROM listings WHERE 1=1';
    const params = {};

    if (marketplace) {
      query += ' AND marketplace = @marketplace';
      params.marketplace = marketplace;
    }
    if (status) {
      query += ' AND status = @status';
      params.status = status;
    }

    query += ' ORDER BY created_at DESC LIMIT @limit OFFSET @offset';
    params.limit = limit;
    params.offset = offset;

    return db.prepare(query).all(params);
  },

  getCount({ marketplace, status } = {}) {
    const db = getDb();
    let query = 'SELECT COUNT(*) as count FROM listings WHERE 1=1';
    const params = {};

    if (marketplace) {
      query += ' AND marketplace = @marketplace';
      params.marketplace = marketplace;
    }
    if (status) {
      query += ' AND status = @status';
      params.status = status;
    }

    return db.prepare(query).get(params).count;
  },

  updateStatus(id, status, errorMessage = null) {
    const db = getDb();
    db.prepare(`
      UPDATE listings SET status = ?, error_message = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, errorMessage, id);
  },

  updateGenerated(id, data) {
    const db = getDb();
    db.prepare(`
      UPDATE listings SET
        status = @status,
        product_analysis = @product_analysis,
        title = @title,
        bullets = @bullets,
        description = @description,
        tags = @tags,
        backend_search_terms = @backend_search_terms,
        materials_field = @materials_field,
        attributes = @attributes,
        alt_texts = @alt_texts,
        updated_at = datetime('now')
      WHERE id = @id
    `).run({ id, ...data });
  },

  updateField(id, field, value) {
    const db = getDb();
    const allowed = ['title', 'bullets', 'description', 'tags', 'backend_search_terms',
      'materials_field', 'attributes', 'alt_texts'];
    if (!allowed.includes(field)) {
      throw new Error(`Cannot update field: ${field}`);
    }
    db.prepare(`UPDATE listings SET ${field} = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(value, id);
  },

  delete(id) {
    const db = getDb();
    db.prepare('DELETE FROM listings WHERE id = ?').run(id);
  },

  addImage(data) {
    const db = getDb();
    db.prepare(`
      INSERT INTO listing_images (id, listing_id, original_filename, stored_filename,
        mime_type, width, height, size_bytes, sort_order)
      VALUES (@id, @listing_id, @original_filename, @stored_filename,
        @mime_type, @width, @height, @size_bytes, @sort_order)
    `).run({
      id: data.id,
      listing_id: data.listing_id,
      original_filename: data.original_filename,
      stored_filename: data.stored_filename,
      mime_type: data.mime_type,
      width: data.width || null,
      height: data.height || null,
      size_bytes: data.size_bytes || null,
      sort_order: data.sort_order || 0,
    });
  },

  getImages(listingId) {
    const db = getDb();
    return db.prepare(
      'SELECT * FROM listing_images WHERE listing_id = ? ORDER BY sort_order'
    ).all(listingId);
  },

  getByBatchJob(batchJobId) {
    const db = getDb();
    return db.prepare(
      'SELECT * FROM listings WHERE batch_job_id = ? ORDER BY created_at'
    ).all(batchJobId);
  },
};

module.exports = listingsRepo;
