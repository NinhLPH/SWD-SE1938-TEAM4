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
let adminToken;

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
  const admin = await User.create({
    fullName: 'Admin',
    email: 'admin-users@example.com',
    passwordHash: 'hash',
    role: 'ADMIN',
  });
  adminToken = sign(admin);
});

describe('admin user management', () => {
  it('creates, updates, lists and locks a user', async () => {
    const created = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Managed User',
        email: 'managed@example.com',
        password: 'Password123!',
        role: 'CUSTOMER',
        status: 'ACTIVE',
      });

    expect(created.status).toBe(201);
    const userId = created.body.data._id;

    const updated = await request(app)
      .patch(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullName: 'Managed User Updated', status: 'ACTIVE' });

    expect(updated.status).toBe(200);
    expect(updated.body.data.fullName).toBe('Managed User Updated');

    const listed = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listed.status).toBe(200);
    expect(listed.body.data.some((user) => user.email === 'managed@example.com')).toBe(true);

    const locked = await request(app)
      .delete(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(locked.status).toBe(200);
    expect(locked.body.data.status).toBe('LOCKED');
  });

  it('allows admin to view products from every shop', async () => {
    const owner = await User.create({
      fullName: 'Owner',
      email: 'admin-product-owner@example.com',
      passwordHash: 'hash',
      role: 'SHOP_OWNER',
    });
    const shop = await Shop.create({
      owner: owner._id,
      name: 'Admin Product Shop',
      address: 'HCMC',
      phone: '0900000000',
    });
    const category = await Category.create({ name: 'Admin Fruit', slug: 'admin-fruit' });
    await Product.create({
      shop: shop._id,
      category: category._id,
      createdBy: owner._id,
      name: 'Admin Visible Mango',
      priceVnd: 50000,
      stockQuantity: 12,
    });

    const response = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].shop.name).toBe('Admin Product Shop');
  });
});
