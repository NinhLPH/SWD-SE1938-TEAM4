const request = require('supertest');
const app = require('../server');
const Product = require('../models/Product');

describe('foundation', () => {
  it('returns the standard health response format', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'API is healthy',
      data: { service: 'fruit-marketplace-api' },
    });
  });

  it('validates integer VND product prices', async () => {
    const product = new Product({
      shop: '64f0c0f0c0f0c0f0c0f0c0f0',
      category: '64f0c0f0c0f0c0f0c0f0c0f1',
      createdBy: '64f0c0f0c0f0c0f0c0f0c0f2',
      name: 'Invalid Price Fruit',
      priceVnd: 1000.5,
      stockQuantity: 10,
    });

    await expect(product.validate()).rejects.toThrow('priceVnd must be an integer amount in VND');
  });
});
