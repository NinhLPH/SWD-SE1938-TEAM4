const connectDB = require('../config/db');
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

const createOrdersFromCart = async (userId, payload, transaction) => {
  const options = { transaction };
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
    paymentStatus: 'PENDING',
    status: 'PENDING',
    shippingAddress: payload.shippingAddress,
  }));

  const createdOrders = await OrderRepository.createMany(orderPayloads, options);
  const payment = await PaymentService.createCheckoutPayment({
    userId,
    orders: createdOrders,
    paymentMethod: payload.paymentMethod,
    transaction,
  });
  await CartRepository.clearCart(userId, options);

  return {
    orders: createdOrders,
    payment,
    transactionMode: 'sqlserver-transaction',
  };
};

const checkout = (userId, payload) => connectDB.sequelize.transaction((transaction) => createOrdersFromCart(userId, payload, transaction));

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

const customerCancelableStatuses = ['PENDING', 'CONFIRMED', 'PACKING'];

const applyCancellation = async (order, transaction) => {
  if (!customerCancelableStatuses.includes(order.status)) {
    throw new AppError('Order can only be cancelled before shipping', 409, 'ORDER_CANCEL_NOT_ALLOWED');
  }

  await ProductRepository.restoreStockMany(order.items, { transaction });
  order.status = 'CANCELLED';
  if (order.paymentStatus === 'PENDING') {
    order.paymentStatus = 'CANCELLED';
  }

  await order.save({ transaction });
  return OrderRepository.findById(order._id, { transaction });
};

const updateShopOrderStatus = async (ownerId, orderId, nextStatus) => {
  const shop = await ShopRepository.findApprovedByOwner(ownerId);

  if (!shop) {
    throw new AppError('Approved shop not found for this owner', 403, 'SHOP_NOT_FOUND');
  }

  return connectDB.sequelize.transaction(async (transaction) => {
    const order = await OrderRepository.findById(orderId, { transaction });

    if (!order || order.shopId.toString() !== shop._id.toString()) {
      throw new AppError('Order not found for this shop', 404, 'ORDER_NOT_FOUND');
    }

    if (!allowedTransitions[order.status].includes(nextStatus)) {
      throw new AppError(`Cannot change order from ${order.status} to ${nextStatus}`, 409, 'INVALID_ORDER_TRANSITION');
    }

    if (nextStatus === 'CANCELLED') {
      return applyCancellation(order, transaction);
    }

    order.status = nextStatus;
    await order.save({ transaction });
    return OrderRepository.findById(order._id, { transaction });
  });
};

const cancelCustomerOrder = (userId, orderId) => connectDB.sequelize.transaction(async (transaction) => {
  const order = await OrderRepository.findById(orderId, { transaction });

  if (!order || order.userId.toString() !== userId.toString()) {
    throw new AppError('Order not found for this customer', 404, 'ORDER_NOT_FOUND');
  }

  return applyCancellation(order, transaction);
});

module.exports = {
  checkout,
  groupItemsByShop,
  listCustomerOrders,
  listShopOrders,
  updateShopOrderStatus,
  cancelCustomerOrder,
  allowedTransitions,
  customerCancelableStatuses,
};
