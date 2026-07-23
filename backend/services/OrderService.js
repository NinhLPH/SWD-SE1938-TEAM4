const connectDB = require('../config/db');
const CartRepository = require('../repositories/CartRepository');
const ProductRepository = require('../repositories/ProductRepository');
const OrderRepository = require('../repositories/OrderRepository');
const PaymentService = require('./PaymentService');
const ShopRepository = require('../repositories/ShopRepository');
const AppError = require('../utils/AppError');

// Gom các item trong giỏ theo shop để checkout tách thành nhiều đơn.
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

// Tạo đơn từ giỏ hàng trong transaction: kiểm tồn, trừ tồn, tạo payment và xóa giỏ.
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

// Bọc toàn bộ checkout trong transaction SQL Server.
const checkout = (userId, payload) => connectDB.sequelize.transaction((transaction) => createOrdersFromCart(userId, payload, transaction));

// Liệt kê đơn hàng của khách hàng.
const listCustomerOrders = (userId) => OrderRepository.findByUser(userId);

// Lấy chi tiết đơn hàng và kiểm tra quyền sở hữu của khách hàng.
const getCustomerOrderDetail = async (userId, orderId) => {
  const order = await OrderRepository.findCustomerOrderById(userId, orderId);

  if (!order) {
    throw new AppError('Order not found for this customer', 404, 'ORDER_NOT_FOUND');
  }

  return order;
};

// Liệt kê các đơn thuộc shop đã duyệt của shop owner.
const listShopOrders = async (ownerId) => {
  const shop = await ShopRepository.findApprovedByOwner(ownerId);

  if (!shop) {
    throw new AppError('Approved shop not found for this owner', 403, 'SHOP_NOT_FOUND');
  }

  return OrderRepository.findByShop(shop._id);
};

const allowedTransitions = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKING'],
  PACKING: ['SHIPPING'],
  SHIPPING: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const customerCancelableStatuses = ['PENDING'];

// Hủy đơn hợp lệ, hoàn tồn kho và cập nhật trạng thái thanh toán nếu còn pending.
const applyCancellation = async (order, transaction) => {
  if (!customerCancelableStatuses.includes(order.status)) {
    throw new AppError('Order can only be cancelled while pending', 409, 'ORDER_CANCEL_NOT_ALLOWED');
  }

  await ProductRepository.restoreStockMany(order.items, { transaction });
  order.status = 'CANCELLED';
  if (order.paymentStatus === 'PENDING') {
    order.paymentStatus = 'CANCELLED';
  }

  await order.save({ transaction });
  return OrderRepository.findById(order._id, { transaction });
};

// Shop owner chuyển trạng thái đơn theo các bước hợp lệ.
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

// Khách hàng hủy đơn của mình trong transaction để hoàn tồn kho nhất quán.
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
  getCustomerOrderDetail,
  listShopOrders,
  updateShopOrderStatus,
  cancelCustomerOrder,
  allowedTransitions,
  customerCancelableStatuses,
};
