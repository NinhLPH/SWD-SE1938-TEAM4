const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const connectDB = require('../config/db');
const { Cart, CartItem, Category, Order, OrderItem, Product, Shop, User } = require('../models');

const sign = (user) => jwt.sign(
  { sub: user._id.toString(), role: user.role },
  process.env.JWT_SECRET || 'dev-secret',
);

const createBaseData = async () => {
  const customer = await User.create({ fullName: 'Customer', email: 'customer-test@example.com', passwordHash: 'hash', role: 'CUSTOMER' });
  const admin = await User.create({ fullName: 'Admin', email: 'admin-test@example.com', passwordHash: 'hash', role: 'ADMIN' });
  const owner = await User.create({ fullName: 'Owner', email: 'owner-test@example.com', passwordHash: 'hash', role: 'SHOP_OWNER' });
  const shop = await Shop.create({ ownerId: owner._id, name: 'Test Shop', address: 'HCMC', phone: '0900000000' });
  const category = await Category.create({ name: 'Tropical', slug: 'tropical' });
  const product = await Product.create({
    shopId: shop._id,
    categoryId: category._id,
    createdById: owner._id,
    name: 'Mango',
    priceVnd: 30000,
    stockQuantity: 5,
    averageRating: 4.8,
  });

  return {
    customer,
    admin,
    owner,
    shop,
    category,
    product,
    customerToken: sign(customer),
    adminToken: sign(admin),
    ownerToken: sign(owner),
  };
};

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await connectDB.sequelize.close();
});

beforeEach(async () => {
  await connectDB.sequelize.sync({ force: true });
});

describe('sqlserver-backed marketplace api', () => {
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
    const product = Product.build({
      shopId: '64f0c0f0c0f0c0f0c0f0c0f0',
      categoryId: '64f0c0f0c0f0c0f0c0f0c0f1',
      createdById: '64f0c0f0c0f0c0f0c0f0c0f2',
      name: 'Invalid Price Fruit',
      priceVnd: 1000.5,
      stockQuantity: 10,
    });

    await expect(product.validate()).rejects.toThrow('priceVnd must be an integer amount in VND');
  });

  it('adds cart items and calculates subtotal on backend', async () => {
    const { customerToken, product } = await createBaseData();

    const response = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: product._id, quantity: 2 });

    expect(response.status).toBe(201);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.subtotalVnd).toBe(60000);
  });

  it('creates one order per shop, stores snapshots, deducts stock, and clears cart', async () => {
    const { customer, customerToken, product } = await createBaseData();
    const cart = await Cart.create({ userId: customer._id });
    await CartItem.create({ cartId: cart._id, productId: product._id, quantity: 2 });

    const response = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        paymentMethod: 'COD',
        shippingAddress: {
          fullName: 'Customer',
          phone: '0900000000',
          address: '123 Fruit Street',
        },
      });

    expect(response.status).toBe(201);
    expect(response.body.data.orders).toHaveLength(1);
    expect((await Product.findByPk(product._id)).stockQuantity).toBe(3);
    expect(await Order.count({ where: { userId: customer._id } })).toBe(1);
    expect(await OrderItem.count({ where: { productId: product._id } })).toBe(1);
    expect(await CartItem.count({ where: { cartId: cart._id } })).toBe(0);
  });

  it('allows admin to view products from every shop', async () => {
    const { adminToken } = await createBaseData();

    const response = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].shop.name).toBe('Test Shop');
  });
});
