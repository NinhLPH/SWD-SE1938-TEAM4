const mongoose = require('mongoose');
const CartRepository = require('../repositories/CartRepository');
const ProductRepository = require('../repositories/ProductRepository');
const OrderRepository = require('../repositories/OrderRepository');
const PaymentService = require('./PaymentService');
const ShopRepository = require('../repositories/ShopRepository');
const AppError = require('../utils/AppError');

const groupItemsByShop = (items) => {
  const groups = new Map();

  items.forEach((item) => {
    const product = item.product;
    if (!product || product.status !== 'ACTIVE') {
      throw new AppError('Cart contains unavailable product', 409, 'PRODUCT_UNAVAILABLE');
    }
    if (product.stockQuantity < item.quantity) {
      throw new AppError('Cart contains item exceeding stock', 409, 'INSUFFICIENT_STOCK');
    }

    const shopId = product.shop._id.toString();
    if (!groups.has(shopId)) {
      groups.set(shopId, {
        shop: product.shop._id,
        items: [],
        totalAmountVnd: 0,
      });
    }

    const lineTotalVnd = product.priceVnd * item.quantity;
    const group = groups.get(shopId);
    group.items.push({
      product: product._id,
      productName: product.name,
      imageUrl: product.imageUrl,
      unitPriceVnd: product.priceVnd,
      quantity: item.quantity,
      lineTotalVnd,
    });
    group.totalAmountVnd += lineTotalVnd;
  });

  return Array.from(groups.values());
};

const supportsTransactions = async () => {
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  return Boolean(hello.setName || hello.msg === 'isdbgrid');
};

const createOrdersFromCart = async (userId, payload, session = null) => {
  const options = session ? { session } : {};
  const cart = await CartRepository.findByUserIdWithProducts(userId, options);

  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400, 'CART_EMPTY');
  }

  const groupedOrders = groupItemsByShop(cart.items);

  for (const item of cart.items) {
    const result = await ProductRepository.deductStockAtomic(
      item.product._id,
      item.quantity,
      options,
    );

    if (result.modifiedCount !== 1) {
      throw new AppError('Unable to reserve product stock', 409, 'INSUFFICIENT_STOCK');
    }
  }

  const orderPayloads = groupedOrders.map((group) => ({
    user: userId,
    shop: group.shop,
    items: group.items,
    totalAmountVnd: group.totalAmountVnd,
    paymentMethod: payload.paymentMethod,
    paymentStatus: payload.paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
    status: 'PENDING',
    shippingAddress: payload.shippingAddress,
  }));

  const createdOrders = await OrderRepository.createMany(orderPayloads, options);
  const payment = await PaymentService.createCheckoutPayment({
    userId,
    orders: createdOrders,
    paymentMethod: payload.paymentMethod,
    session,
  });
  await CartRepository.clearCart(userId, options);

  return {
    orders: createdOrders,
    payment,
    transactionMode: session ? 'transaction' : 'standalone-fallback',
  };
};

const checkout = async (userId, payload) => {
  if (!(await supportsTransactions())) {
    return createOrdersFromCart(userId, payload);
  }

  const session = await mongoose.startSession();

  try {
    let result = null;
    await session.withTransaction(async () => {
      result = await createOrdersFromCart(userId, payload, session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

const listCustomerOrders = (userId) => OrderRepository.findByUser(userId);

const listShopOrders = async (ownerId) => {
  const shop = await ShopRepository.findApprovedByOwner(ownerId);

  if (!shop) {
    throw new AppError('Approved shop not found for this owner', 403, 'SHOP_NOT_FOUND');
  }

  return OrderRepository.findByShop(shop._id);
};

const allowedTransitions = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKING', 'CANCELLED'],
  PACKING: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const updateShopOrderStatus = async (ownerId, orderId, nextStatus) => {
  const shop = await ShopRepository.findApprovedByOwner(ownerId);

  if (!shop) {
    throw new AppError('Approved shop not found for this owner', 403, 'SHOP_NOT_FOUND');
  }

  const order = await OrderRepository.findById(orderId);

  if (!order || order.shop.toString() !== shop._id.toString()) {
    throw new AppError('Order not found for this shop', 404, 'ORDER_NOT_FOUND');
  }

  if (!allowedTransitions[order.status].includes(nextStatus)) {
    throw new AppError(`Cannot change order from ${order.status} to ${nextStatus}`, 409, 'INVALID_ORDER_TRANSITION');
  }

  order.status = nextStatus;
  if (nextStatus === 'CANCELLED' && order.paymentStatus === 'PENDING') {
    order.paymentStatus = 'CANCELLED';
  }

  await order.save();
  return order;
};

module.exports = {
  checkout,
  groupItemsByShop,
  listCustomerOrders,
  listShopOrders,
  updateShopOrderStatus,
  allowedTransitions,
};
