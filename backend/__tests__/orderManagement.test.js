const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');

let mongoServer;
let customer;
let owner;
let order;
let customerToken;
let ownerToken;

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
    fullName: 'Order Customer',
    email: 'order-customer@example.com',
    passwordHash: 'hash',
    role: 'CUSTOMER',
  });
  owner = await User.create({
    fullName: 'Order Owner',
    email: 'order-owner@example.com',
    passwordHash: 'hash',
    role: 'SHOP_OWNER',
  });
  const shop = await Shop.create({
    owner: owner._id,
    name: 'Order Shop',
    address: 'HCMC',
    phone: '0900000000',
  });
  const category = await Category.create({ name: 'Berry', slug: 'berry' });
  const product = await Product.create({
    shop: shop._id,
    category: category._id,
    createdBy: owner._id,
    name: 'Berry',
    priceVnd: 50000,
    stockQuantity: 5,
  });
  order = await Order.create({
    user: customer._id,
    shop: shop._id,
    items: [{
      product: product._id,
      productName: product.name,
      unitPriceVnd: product.priceVnd,
      quantity: 1,
      lineTotalVnd: product.priceVnd,
    }],
    totalAmountVnd: product.priceVnd,
    paymentMethod: 'COD',
    shippingAddress: {
      fullName: 'Order Customer',
      phone: '0900000000',
      address: '123 Fruit Street',
    },
  });
  customerToken = sign(customer);
  ownerToken = sign(owner);
});

describe('order management', () => {
  it('allows customer and shop owner to list scoped orders', async () => {
    const mine = await request(app)
      .get('/api/orders/mine')
      .set('Authorization', `Bearer ${customerToken}`);
    const shopOrders = await request(app)
      .get('/api/orders/shop')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(mine.status).toBe(200);
    expect(mine.body.data).toHaveLength(1);
    expect(shopOrders.status).toBe(200);
    expect(shopOrders.body.data).toHaveLength(1);
  });

  it('enforces valid shop owner state transitions', async () => {
    const confirmed = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'CONFIRMED' });

    expect(confirmed.status).toBe(200);
    expect(confirmed.body.data.status).toBe('CONFIRMED');

    const invalid = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'DELIVERED' });

    expect(invalid.status).toBe(409);
    expect(invalid.body.error.code).toBe('INVALID_ORDER_TRANSITION');
  });
});
