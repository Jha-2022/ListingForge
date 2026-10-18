const { getDb } = require('../db/database');

const batchRepo = {
  createJob(data) {
    const db = getDb();
    db.prepare(`
      INSERT INTO batch_jobs (id, marketplace, language, voice_profile_id, total_items)
      VALUES (@id, @marketplace, @language, @voice_profile_id, @total_items)
    `).run({
      id: data.id,
      marketplace: data.marketplace,
      language: data.language || 'english',
      voice_profile_id: data.voice_profile_id || null,
      total_items: data.total_items,
    });
  },

  getJob(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM batch_jobs WHERE id = ?').get(id);
  },

  getAllJobs() {
    const db = getDb();
    return db.prepare('SELECT * FROM batch_jobs ORDER BY created_at DESC').all();
  },

  updateJobStatus(id, status, errorMessage = null) {
    const db = getDb();
    db.prepare(`
      UPDATE batch_jobs SET status = ?, error_message = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, errorMessage, id);
  },

  createItem(data) {
    const db = getDb();
    db.prepare(`
      INSERT INTO batch_items (id, batch_job_id, product_id, image_filenames,
        name_hint, price, keywords, sort_order)
      VALUES (@id, @batch_job_id, @product_id, @image_filenames,
        @name_hint, @price, @keywords, @sort_order)
    `).run({
      id: data.id,
      batch_job_id: data.batch_job_id,
      product_id: data.product_id || null,
      image_filenames: data.image_filenames || '[]',
      name_hint: data.name_hint || null,
      price: data.price || null,
      keywords: data.keywords || '[]',
      sort_order: data.sort_order || 0,
    });
  },

  getJobItems(jobId) {
    const db = getDb();
    return db.prepare(
      'SELECT * FROM batch_items WHERE batch_job_id = ? ORDER BY sort_order'
    ).all(jobId);
  },

  getItem(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM batch_items WHERE id = ?').get(id);
  },

  updateItemStatus(id, status, errorMessage = null) {
    const db = getDb();
    db.prepare(`
      UPDATE batch_items SET status = ?, error_message = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, errorMessage, id);
  },

  linkItemListing(itemId, listingId) {
    const db = getDb();
    db.prepare('UPDATE batch_items SET listing_id = ? WHERE id = ?').run(listingId, itemId);
  },

  incrementCompleted(jobId) {
    const db = getDb();
    db.prepare(`
      UPDATE batch_jobs SET completed_items = completed_items + 1, updated_at = datetime('now')
      WHERE id = ?
    `).run(jobId);
  },

  incrementFailed(jobId) {
    const db = getDb();
    db.prepare(`
      UPDATE batch_jobs SET failed_items = failed_items + 1, updated_at = datetime('now')
      WHERE id = ?
    `).run(jobId);
  },
};

module.exports = batchRepo;
