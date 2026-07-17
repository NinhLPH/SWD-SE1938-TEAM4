const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const Product = require('../models/Product');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

describe('search', () => {
  it('filters active products by category, stock, price, rating and paginates', async () => {
    const owner = await User.create({
      fullName: 'Owner',
      email: 'search-owner@example.com',
      passwordHash: 'hash',
      role: 'SHOP_OWNER',
    });
    const shop = await Shop.create({
      owner: owner._id,
      name: 'Search Shop',
      address: 'HCMC',
      phone: '0900000000',
    });
    const tropical = await Category.create({ name: 'Tropical', slug: 'tropical' });
    const citrus = await Category.create({ name: 'Citrus', slug: 'citrus' });

    await Product.create([
      {
        shop: shop._id,
        category: tropical._id,
        createdBy: owner._id,
        name: 'Fresh Mango',
        priceVnd: 35000,
        stockQuantity: 5,
        averageRating: 4.8,
      },
      {
        shop: shop._id,
        category: citrus._id,
        createdBy: owner._id,
        name: 'Orange',
        priceVnd: 25000,
        stockQuantity: 0,
        averageRating: 4.2,
      },
      {
        shop: shop._id,
        category: tropical._id,
        createdBy: owner._id,
        name: 'Deleted Mango',
        priceVnd: 30000,
        stockQuantity: 10,
        averageRating: 5,
        status: 'DELETED',
      },
    ]);

    const response = await request(app)
      .get('/api/search/products')
      .query({
        categoryId: tropical._id.toString(),
        inStock: true,
        minPriceVnd: 30000,
        maxPriceVnd: 40000,
        minRating: 4.5,
        page: 1,
        limit: 10,
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe('Fresh Mango');
    expect(response.body.meta.total).toBe(1);
  });
});
