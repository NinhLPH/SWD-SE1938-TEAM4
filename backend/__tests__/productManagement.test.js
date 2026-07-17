const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const Product = require('../models/Product');

let mongoServer;
let owner;
let otherOwner;
let category;
let token;
let otherToken;

const sign = (user) => jwt.sign(
  { sub: user._id.toString(), role: user.role },
  process.env.JWT_SECRET || 'dev-secret',
);

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
  const passwordHash = await bcrypt.hash('Password123!', 10);

  owner = await User.create({
    fullName: 'Owner One',
    email: 'owner1@example.com',
    passwordHash,
    role: 'SHOP_OWNER',
  });
  otherOwner = await User.create({
    fullName: 'Owner Two',
    email: 'owner2@example.com',
    passwordHash,
    role: 'SHOP_OWNER',
  });
  await Shop.create({
    owner: owner._id,
    name: 'Owner Shop',
    address: 'HCMC',
    phone: '0900000000',
    status: 'APPROVED',
  });
  await Shop.create({
    owner: otherOwner._id,
    name: 'Other Shop',
    address: 'Hanoi',
    phone: '0900000001',
    status: 'APPROVED',
  });
  category = await Category.create({ name: 'Tropical', slug: 'tropical' });
  token = sign(owner);
  otherToken = sign(otherOwner);
});

describe('product management', () => {
  it('allows a shop owner to create, update, and soft delete owned products', async () => {
    const createResponse = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category._id.toString(),
        name: 'Dragon Fruit',
        priceVnd: 30000,
        stockQuantity: 25,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.status).toBe('ACTIVE');

    const productId = createResponse.body.data._id;
    const updateResponse = await request(app)
      .patch(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stockQuantity: 20 });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.stockQuantity).toBe(20);

    const deleteResponse = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(200);
    const deleted = await Product.findById(productId);
    expect(deleted.status).toBe('DELETED');
  });

  it('blocks updates from another shop owner', async () => {
    const shop = await Shop.findOne({ owner: owner._id });
    const product = await Product.create({
      shop: shop._id,
      category: category._id,
      createdBy: owner._id,
      name: 'Pomelo',
      priceVnd: 40000,
      stockQuantity: 10,
    });

    const response = await request(app)
      .patch(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ stockQuantity: 1 });

    expect(response.status).toBe(404);
  });
});
