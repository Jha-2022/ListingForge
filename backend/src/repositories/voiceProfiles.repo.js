const { getDb } = require('../db/database');

const voiceProfilesRepo = {
  create(data) {
    const db = getDb();
    db.prepare(`
      INSERT INTO voice_profiles (id, name, style_description, sample_listings)
      VALUES (@id, @name, @style_description, @sample_listings)
    `).run({
      id: data.id,
      name: data.name,
      style_description: data.style_description || null,
      sample_listings: data.sample_listings ? JSON.stringify(data.sample_listings) : null,
    });
  },

  getById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM voice_profiles WHERE id = ?').get(id);
  },

  getAll() {
    const db = getDb();
    return db.prepare('SELECT * FROM voice_profiles ORDER BY created_at DESC').all();
  },

  update(id, data) {
    const db = getDb();
    const fields = [];
    const params = { id };

    if (data.name !== undefined) {
      fields.push('name = @name');
      params.name = data.name;
    }
    if (data.style_description !== undefined) {
      fields.push('style_description = @style_description');
      params.style_description = data.style_description;
    }
    if (data.sample_listings !== undefined) {
      fields.push('sample_listings = @sample_listings');
      params.sample_listings = JSON.stringify(data.sample_listings);
    }

    if (fields.length === 0) return;

    fields.push("updated_at = datetime('now')");
    db.prepare(`UPDATE voice_profiles SET ${fields.join(', ')} WHERE id = @id`).run(params);
  },

  delete(id) {
    const db = getDb();
    db.prepare('DELETE FROM voice_profiles WHERE id = ?').run(id);
  },
};

module.exports = voiceProfilesRepo;
