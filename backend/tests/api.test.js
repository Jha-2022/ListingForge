const request = require('supertest');
const app = require('../src/app');
const { migrate } = require('../src/db/migrate');
const { closeDb } = require('../src/db/database');

beforeAll(() => {
  migrate();
});

afterAll(() => {
  closeDb();
});

describe('API Smoke Tests', () => {
  it('GET /api/health returns health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.service).toBe('listingforge-backend');
  });

  it('GET /api/listings returns listings array', async () => {
    const res = await request(app).get('/api/listings');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.listings)).toBe(true);
  });

  it('GET /api/voice-profiles returns profiles array', async () => {
    const res = await request(app).get('/api/voice-profiles');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('License verification endpoint works', async () => {
    const genRes = await request(app)
      .post('/api/license/generate')
      .send({ email: 'seller@example.com' });
    expect(genRes.statusCode).toBe(200);
    expect(genRes.body.data.license_key).toBeDefined();

    const verifyRes = await request(app)
      .post('/api/license/verify')
      .send({ license_key: genRes.body.data.license_key });
    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body.data.valid).toBe(true);
    expect(verifyRes.body.data.email).toBe('seller@example.com');
  });
});
