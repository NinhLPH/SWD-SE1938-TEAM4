const Order = require('../models/Order');

const createMany = (orders, options = {}) => Order.create(orders, {
  ...options,
  ordered: true,
});

const findByUser = (userId) => Order.find({ user: userId })
  .populate('shop', 'name')
  .sort({ createdAt: -1 });

const findByShop = (shopId) => Order.find({ shop: shopId })
  .populate('user', 'fullName email phone')
  .sort({ createdAt: -1 });

const findById = (orderId) => Order.findById(orderId);

const updatePaymentStatusMany = (orderIds, paymentStatus, options = {}) => Order.updateMany(
  { _id: { $in: orderIds } },
  { $set: { paymentStatus } },
  options,
);

module.exports = {
  createMany,
  findByUser,
  findByShop,
  findById,
  updatePaymentStatusMany,
};
