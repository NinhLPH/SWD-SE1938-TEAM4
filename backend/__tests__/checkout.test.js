const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const PaymentService = require('../services/PaymentService');

let replSet;
let customer;
let productA;
let productB;
let token;

const sign = (user) => jwt.sign(
  { sub: user._id.toString(), role: user.role },
  process.env.JWT_SECRET || 'dev-secret',
);

const createShopWithProduct = async ({ ownerEmail, shopName, productName, priceVnd, stockQuantity }) => {
  const owner = await User.create({
    fullName: shopName,
    email: ownerEmail,
    passwordHash: 'hash',
    role: 'SHOP_OWNER',
  });
  const shop = await Shop.create({
    owner: owner._id,
    name: shopName,
    address: 'HCMC',
    phone: '0900000000',
  });
  const category = await Category.create({
    name: productName,
    slug: productName.toLowerCase().replace(/\s+/g, '-'),
  });
  return Product.create({
    shop: shop._id,
    category: category._id,
    createdBy: owner._id,
    name: productName,
    imageUrl: `https://example.com/${productName}.jpg`,
    priceVnd,
    stockQuantity,
  });
};

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
  customer = await User.create({
    fullName: 'Checkout Customer',
    email: 'checkout-customer@example.com',
    passwordHash: 'hash',
    role: 'CUSTOMER',
  });
  productA = await createShopWithProduct({
    ownerEmail: 'checkout-owner-a@example.com',
    shopName: 'Shop A',
    productName: 'Mango',
    priceVnd: 30000,
    stockQuantity: 10,
  });
  productB = await createShopWithProduct({
    ownerEmail: 'checkout-owner-b@example.com',
    shopName: 'Shop B',
    productName: 'Apple',
    priceVnd: 20000,
    stockQuantity: 10,
  });
  token = sign(customer);
});

describe('checkout', () => {
  it('creates one order per shop, stores snapshots, deducts stock, and clears cart', async () => {
    await Cart.create({
      user: customer._id,
      items: [
        { product: productA._id, quantity: 2 },
        { product: productB._id, quantity: 3 },
      ],
    });

    const response = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        paymentMethod: 'COD',
        shippingAddress: {
          fullName: 'Checkout Customer',
          phone: '0900000000',
          address: '123 Fruit Street',
        },
      });

    expect(response.status).toBe(201);
    expect(response.body.data.orders).toHaveLength(2);
    expect(response.body.data.payment.provider).toBe('COD');

    const orders = await Order.find({ user: customer._id });
    expect(orders).toHaveLength(2);
    expect(orders.flatMap((order) => order.items).map((item) => item.productName).sort()).toEqual(['Apple', 'Mango']);

    const updatedA = await Product.findById(productA._id);
    const updatedB = await Product.findById(productB._id);
    expect(updatedA.stockQuantity).toBe(8);
    expect(updatedB.stockQuantity).toBe(7);

    const cart = await Cart.findOne({ user: customer._id });
    expect(cart.items).toHaveLength(0);
  });

  it('processes online payment callback idempotently', async () => {
    await Cart.create({
      user: customer._id,
      items: [
        { product: productA._id, quantity: 1 },
      ],
    });

    const checkoutResponse = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        paymentMethod: 'ONLINE',
        shippingAddress: {
          fullName: 'Checkout Customer',
          phone: '0900000000',
          address: '123 Fruit Street',
        },
      });

    const transactionId = checkoutResponse.body.data.payment.transactionId;
    const callbackPayload = {
      transactionId,
      eventId: 'evt-paid-1',
      status: 'PAID',
    };
    const signature = PaymentService.signMockCallback(callbackPayload);

    const first = await request(app)
      .post('/api/payments/mock/callback')
      .send({ ...callbackPayload, signature });
    const second = await request(app)
      .post('/api/payments/mock/callback')
      .send({ ...callbackPayload, signature });

    expect(first.status).toBe(200);
    expect(first.body.data.duplicate).toBe(false);
    expect(second.status).toBe(200);
    expect(second.body.data.duplicate).toBe(true);

    const payment = await Payment.findOne({ transactionId });
    expect(payment.status).toBe('PAID');
    expect(payment.callbackEvents).toHaveLength(1);
    expect(await Order.countDocuments({ paymentStatus: 'PAID' })).toBe(1);
  });

  it('lets a customer confirm their mock online payment from the demo payment page', async () => {
    await Cart.create({
      user: customer._id,
      items: [
        { product: productA._id, quantity: 1 },
      ],
    });

    const checkoutResponse = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        paymentMethod: 'ONLINE',
        shippingAddress: {
          fullName: 'Checkout Customer',
          phone: '0900000000',
          address: '123 Fruit Street',
        },
      });

    const transactionId = checkoutResponse.body.data.payment.transactionId;
    const confirmResponse = await request(app)
      .post(`/api/payments/mock/${transactionId}/confirm`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(confirmResponse.status).toBe(200);
    expect(confirmResponse.body.data.payment.status).toBe('PAID');
    expect(await Order.countDocuments({ paymentStatus: 'PAID' })).toBe(1);
  });

  it('allows only one concurrent checkout to consume the last stock item', async () => {
    const secondCustomer = await User.create({
      fullName: 'Second Customer',
      email: 'second-checkout@example.com',
      passwordHash: 'hash',
      role: 'CUSTOMER',
    });
    const secondToken = sign(secondCustomer);
    await Product.updateOne({ _id: productA._id }, { $set: { stockQuantity: 1 } });
    await Cart.create({ user: customer._id, items: [{ product: productA._id, quantity: 1 }] });
    await Cart.create({ user: secondCustomer._id, items: [{ product: productA._id, quantity: 1 }] });

    const body = {
      paymentMethod: 'COD',
      shippingAddress: {
        fullName: 'Checkout Customer',
        phone: '0900000000',
        address: '123 Fruit Street',
      },
    };

    const responses = await Promise.all([
      request(app).post('/api/orders/checkout').set('Authorization', `Bearer ${token}`).send(body),
      request(app).post('/api/orders/checkout').set('Authorization', `Bearer ${secondToken}`).send(body),
    ]);
    const statuses = responses.map((response) => response.status).sort();

    expect(statuses).toEqual([201, 409]);
    expect((await Product.findById(productA._id)).stockQuantity).toBe(0);
    expect(await Order.countDocuments({ 'items.product': productA._id })).toBe(1);
  });

  it('aborts the whole transaction when any atomic stock deduction fails', async () => {
    await Cart.create({
      user: customer._id,
      items: [
        { product: productA._id, quantity: 2 },
        { product: productB._id, quantity: 99 },
      ],
    });

    const response = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        paymentMethod: 'COD',
        shippingAddress: {
          fullName: 'Checkout Customer',
          phone: '0900000000',
          address: '123 Fruit Street',
        },
      });

    expect(response.status).toBe(409);
    expect(await Order.countDocuments({ user: customer._id })).toBe(0);
    expect((await Product.findById(productA._id)).stockQuantity).toBe(10);
    expect((await Product.findById(productB._id)).stockQuantity).toBe(10);
  });
});
