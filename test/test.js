const request = require('supertest');
const app = require('../server');

describe('Paradise Bakes & Cafe API', () => {
  describe('Health Check', () => {
    it('should return 200 for health check', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
    });
  });

  describe('Authentication', () => {
    it('should return 401 for protected routes without token', async () => {
      const response = await request(app).get('/api/business');
      expect(response.status).toBe(401);
    });
  });

  describe('Menu API', () => {
    it('should return menu items', async () => {
      const response = await request(app).get('/api/menu');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.menu)).toBe(true);
    });
  });
});
