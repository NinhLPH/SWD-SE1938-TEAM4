const { Payment } = require('../models');

// Tạo bản ghi payment cho một hoặc nhiều đơn.
const create = (data, options = {}) => Payment.create({
  orderIds: data.orders,
  userId: data.user,
  provider: data.provider,
  transactionId: data.transactionId,
  amountVnd: data.amountVnd,
  status: data.status,
  callbackEvents: data.callbackEvents || [],
}, {
  transaction: options.transaction,
});

// Tìm payment theo mã giao dịch.
const findByTransactionId = (transactionId) => Payment.findOne({
  where: { transactionId },
});

// Kiểm tra event callback đã được xử lý chưa.
const findProcessedEvent = async (transactionId, eventId) => {
  const payment = await findByTransactionId(transactionId);
  if (!payment) return null;
  return (payment.callbackEvents || []).some((event) => event.eventId === eventId) ? payment : null;
};

// Tìm payment chứa orderId trong danh sách orderIds.
const findByOrderId = async (orderId) => {
  const payments = await Payment.findAll();
  return payments.find((payment) => (payment.orderIds || []).includes(orderId)) || null;
};

// Thêm event callback mới nếu chưa từng xử lý eventId này.
const appendCallbackEvent = async (transactionId, event) => {
  const payment = await findByTransactionId(transactionId);
  if (!payment) return null;

  const callbackEvents = payment.callbackEvents || [];
  if (callbackEvents.some((item) => item.eventId === event.eventId)) {
    return null;
  }

  payment.callbackEvents = [
    ...callbackEvents,
    {
      ...event,
      receivedAt: new Date().toISOString(),
    },
  ];
  payment.changed('callbackEvents', true);
  await payment.save();
  return payment;
};

// Cập nhật trạng thái payment theo mã giao dịch.
const setStatus = async (transactionId, status, options = {}) => {
  const payment = await findByTransactionId(transactionId);
  if (!payment) return null;
  payment.status = status;
  await payment.save({ transaction: options.transaction });
  return payment;
};

// Thêm callback event và đổi trạng thái payment trong một lần lưu.
const appendCallbackAndSetStatus = async (transactionId, event, status) => {
  const payment = await findByTransactionId(transactionId);
  if (!payment) return null;

  const callbackEvents = payment.callbackEvents || [];
  if (callbackEvents.some((item) => item.eventId === event.eventId)) {
    return null;
  }

  payment.status = status;
  payment.callbackEvents = [
    ...callbackEvents,
    {
      ...event,
      receivedAt: new Date().toISOString(),
    },
  ];
  payment.changed('callbackEvents', true);
  await payment.save();
  return payment;
};

module.exports = {
  create,
  findByTransactionId,
  findByOrderId,
  findProcessedEvent,
  appendCallbackEvent,
  setStatus,
  appendCallbackAndSetStatus,
};
