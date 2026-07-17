const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const Product = require('../models/Product');

let mongoServer;
let customer;
let owner;
let product;
let token;

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
  customer = await User.create({
    fullName: 'Customer',
    email: 'cart-customer@example.com',
    passwordHash: 'hash',
    role: 'CUSTOMER',
  });
  owner = await User.create({
    fullName: 'Owner',
    email: 'cart-owner@example.com',
    passwordHash: 'hash',
    role: 'SHOP_OWNER',
  });
  const shop = await Shop.create({
    owner: owner._id,
    name: 'Cart Shop',
    address: 'HCMC',
    phone: '0900000000',
  });
  const category = await Category.create({ name: 'Apple', slug: 'apple' });
  product = await Product.create({
    shop: shop._id,
    category: category._id,
    createdBy: owner._id,
    name: 'Apple',
    priceVnd: 10000,
    stockQuantity: 3,
  });
  token = sign(customer);
});

describe('cart', () => {
  it('adds, updates, removes items and calculates subtotal on backend', async () => {
    const addResponse = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 2 });

    expect(addResponse.status).toBe(201);
    expect(addResponse.body.data.subtotalVnd).toBe(20000);
    const itemId = addResponse.body.data.items[0].id;

    const updateResponse = await request(app)
      .patch(`/api/cart/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 3 });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.subtotalVnd).toBe(30000);

    const removeResponse = await request(app)
      .delete(`/api/cart/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(removeResponse.status).toBe(200);
    expect(removeResponse.body.data.items).toHaveLength(0);
    expect(removeResponse.body.data.subtotalVnd).toBe(0);
  });

  it('rejects quantity above current stock', async () => {
    const response = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 4 });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('INSUFFICIENT_STOCK');
  });
});
