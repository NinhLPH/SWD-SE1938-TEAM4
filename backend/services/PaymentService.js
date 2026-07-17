const crypto = require('crypto');
const PaymentRepository = require('../repositories/PaymentRepository');
const OrderRepository = require('../repositories/OrderRepository');
const AppError = require('../utils/AppError');

const createCheckoutPayment = async ({ userId, orders, paymentMethod, session }) => {
  const amountVnd = orders.reduce((sum, order) => sum + order.totalAmountVnd, 0);
  const provider = paymentMethod === 'COD' ? 'COD' : 'MOCK';
  const prefix = paymentMethod === 'COD' ? 'COD' : 'MOCK';

  return PaymentRepository.create({
    orders: orders.map((order) => order._id),
    user: userId,
    provider,
    transactionId: `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    amountVnd,
    status: 'PENDING',
  }, { session });
};

const hashPayload = (payload) => crypto
  .createHash('sha256')
  .update(JSON.stringify(payload))
  .digest('hex');

const signMockCallback = ({ transactionId, status }) => crypto
  .createHash('sha256')
  .update(`${transactionId}:${status}:${process.env.PAYMENT_CALLBACK_SECRET || 'dev-payment-secret'}`)
  .digest('hex');

const verifyMockCallback = (payload) => payload.signature === signMockCallback(payload);

const handleMockCallback = async (payload) => {
  if (!verifyMockCallback(payload)) {
    throw new AppError('Invalid payment callback signature', 401, 'INVALID_PAYMENT_SIGNATURE');
  }

  const payment = await PaymentRepository.findByTransactionId(payload.transactionId);
  if (!payment) {
    throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
  }

  const existingEvent = await PaymentRepository.findProcessedEvent(payload.transactionId, payload.eventId);
  if (existingEvent) {
    return {
      payment: existingEvent,
      duplicate: true,
    };
  }

  const nextStatus = payload.status === 'PAID' ? 'PAID' : 'FAILED';
  const updatedPayment = await PaymentRepository.appendCallbackAndSetStatus(
    payload.transactionId,
    {
      eventId: payload.eventId,
      payloadHash: hashPayload(payload),
    },
    nextStatus,
  );

  if (!updatedPayment) {
    const current = await PaymentRepository.findByTransactionId(payload.transactionId);
    return {
      payment: current,
      duplicate: true,
    };
  }

  await OrderRepository.updatePaymentStatusMany(updatedPayment.orders, nextStatus);

  return {
    payment: updatedPayment,
    duplicate: false,
  };
};

const confirmMockPaymentForUser = async (userId, transactionId) => {
  const payment = await PaymentRepository.findByTransactionId(transactionId);

  if (!payment) {
    throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
  }
  if (payment.user.toString() !== userId.toString()) {
    throw new AppError('Payment does not belong to this user', 403, 'PAYMENT_FORBIDDEN');
  }
  if (payment.provider !== 'MOCK') {
    throw new AppError('Only online demo payments can be confirmed here', 400, 'PAYMENT_METHOD_INVALID');
  }
  if (payment.status === 'PAID') {
    return {
      payment,
      duplicate: true,
    };
  }

  const payload = {
    transactionId,
    eventId: `demo-paid-${transactionId}`,
    status: 'PAID',
  };

  return handleMockCallback({
    ...payload,
    signature: signMockCallback(payload),
  });
};

module.exports = {
  createCheckoutPayment,
  handleMockCallback,
  confirmMockPaymentForUser,
  signMockCallback,
};
