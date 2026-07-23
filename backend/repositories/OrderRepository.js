const { Op } = require('sequelize');
const { Order, OrderItem, Shop, User } = require('../models');

const includeDetails = [
  { model: OrderItem, as: 'items' },
  { model: Shop, as: 'shop', attributes: ['id', 'name'] },
];

// Tạo nhiều đơn và item chi tiết tương ứng trong cùng transaction.
const createMany = async (orders, options = {}) => Promise.all(orders.map(async (payload) => {
  const order = await Order.create({
    userId: payload.user,
    shopId: payload.shop,
    totalAmountVnd: payload.totalAmountVnd,
    paymentMethod: payload.paymentMethod,
    paymentStatus: payload.paymentStatus,
    status: payload.status,
    shippingAddress: payload.shippingAddress,
  }, { transaction: options.transaction });

  await OrderItem.bulkCreate(payload.items.map((item) => ({
    orderId: order.id,
    productId: item.product,
    productName: item.productName,
    imageUrl: item.imageUrl,
    unitPriceVnd: item.unitPriceVnd,
    quantity: item.quantity,
    lineTotalVnd: item.lineTotalVnd,
  })), { transaction: options.transaction });

  return Order.findByPk(order.id, {
    include: includeDetails,
    transaction: options.transaction,
  });
}));

// Tìm các đơn hàng của một khách hàng.
const findByUser = (userId) => Order.findAll({
  where: { userId },
  include: includeDetails,
  order: [['createdAt', 'DESC']],
});

// Tìm một đơn theo id và userId để kiểm quyền khách hàng.
const findCustomerOrderById = (userId, orderId, options = {}) => Order.findOne({
  where: { id: orderId, userId },
  include: includeDetails,
  transaction: options.transaction,
});

// Tìm các đơn thuộc một shop, kèm thông tin khách hàng.
const findByShop = (shopId) => Order.findAll({
  where: { shopId },
  include: [
    { model: OrderItem, as: 'items' },
    { model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] },
  ],
  order: [['createdAt', 'DESC']],
});

// Tìm đơn theo id kèm danh sách item.
const findById = (orderId, options = {}) => Order.findByPk(orderId, {
  include: [{ model: OrderItem, as: 'items' }],
  transaction: options.transaction,
});

// Tìm nhiều đơn theo danh sách id.
const findByIds = (orderIds, options = {}) => Order.findAll({
  where: { id: { [Op.in]: orderIds } },
  include: [{ model: OrderItem, as: 'items' }],
  transaction: options.transaction,
});

// Cập nhật trạng thái thanh toán của một đơn và trả lại đơn mới nhất.
const updatePaymentStatusById = async (orderId, paymentStatus, options = {}) => {
  await Order.update(
    { paymentStatus },
    {
      where: { id: orderId },
      transaction: options.transaction,
    },
  );
  return findById(orderId, options);
};

// Cập nhật trạng thái thanh toán cho nhiều đơn cùng lúc.
const updatePaymentStatusMany = (orderIds, paymentStatus, options = {}) => Order.update(
  { paymentStatus },
  {
    where: { id: { [Op.in]: orderIds } },
    transaction: options.transaction,
  },
);

module.exports = {
  createMany,
  findByUser,
  findCustomerOrderById,
  findByShop,
  findById,
  findByIds,
  updatePaymentStatusById,
  updatePaymentStatusMany,
};
