const crypto = require('crypto');
const PaymentRepository = require('../repositories/PaymentRepository');
const OrderRepository = require('../repositories/OrderRepository');
const ShopRepository = require('../repositories/ShopRepository');
const AppError = require('../utils/AppError');

const VIETQR_CONFIG = {
  bankId: process.env.VIETQR_BANK_ID || 'MB',
  bankName: process.env.VIETQR_BANK_NAME || 'MB Bank',
  accountNo: process.env.VIETQR_ACCOUNT_NO || '0981197806',
  accountName: process.env.VIETQR_ACCOUNT_NAME || '',
  template: process.env.VIETQR_TEMPLATE || 'compact2',
};

// Tạo URL ảnh VietQR từ cấu hình ngân hàng và nội dung chuyển khoản.
const buildVietQrImageUrl = ({ amountVnd, addInfo }) => {
  const query = new URLSearchParams({
    amount: String(amountVnd),
    addInfo,
  });

  if (VIETQR_CONFIG.accountName) {
    query.set('accountName', VIETQR_CONFIG.accountName);
  }

  return `https://img.vietqr.io/image/${VIETQR_CONFIG.bankId}-${VIETQR_CONFIG.accountNo}-${VIETQR_CONFIG.template}.png?${query.toString()}`;
};

// Đóng gói thông tin chuyển khoản VietQR trả về cho frontend.
const buildVietQrTransfer = ({ amountVnd, addInfo }) => ({
  bankId: VIETQR_CONFIG.bankId,
  bankName: VIETQR_CONFIG.bankName,
  accountNo: VIETQR_CONFIG.accountNo,
  accountName: VIETQR_CONFIG.accountName,
  amountVnd,
  addInfo,
  template: VIETQR_CONFIG.template,
  qrImageUrl: buildVietQrImageUrl({ amountVnd, addInfo }),
});

// Tạo bản ghi thanh toán cho các đơn trong cùng một lần checkout.
const createCheckoutPayment = async ({ userId, orders, paymentMethod, transaction }) => {
  const amountVnd = orders.reduce((sum, order) => sum + order.totalAmountVnd, 0);
  const isCod = paymentMethod === 'COD';
  const provider = isCod ? 'COD' : 'MOCK';
  const prefix = isCod ? 'COD' : 'QR';
  const paymentCode = `${prefix}${Date.now().toString().slice(-8)}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  const payment = await PaymentRepository.create({
    orders: orders.map((order) => order._id),
    user: userId,
    provider,
    transactionId: paymentCode,
    amountVnd,
    status: 'PENDING',
  }, { transaction });

  const paymentJson = payment.toJSON();
  if (!isCod) {
    paymentJson.qrTransfer = buildVietQrTransfer({
      amountVnd,
      addInfo: paymentCode,
    });
  }

  return paymentJson;
};

// Hash payload callback để lưu dấu vết chống xử lý trùng.
const hashPayload = (payload) => crypto
  .createHash('sha256')
  .update(JSON.stringify(payload))
  .digest('hex');

// Ký callback mock bằng secret nội bộ.
const signMockCallback = ({ transactionId, status }) => crypto
  .createHash('sha256')
  .update(`${transactionId}:${status}:${process.env.PAYMENT_CALLBACK_SECRET || 'dev-payment-secret'}`)
  .digest('hex');

// Kiểm tra chữ ký callback mock trước khi xử lý.
const verifyMockCallback = (payload) => payload.signature === signMockCallback(payload);

// Xác định payment có thuộc nhóm thanh toán online cần xác nhận hay không.
const isOnlinePayment = (payment) => payment && ['MOCK', 'VIETQR'].includes(payment.provider);

// Xử lý callback mock, chống trùng event và cập nhật trạng thái đơn liên quan.
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

// Người dùng xác nhận thanh toán mock và tạo callback nội bộ hợp lệ.
const confirmMockPaymentForUser = async (userId, transactionId) => {
  const payment = await PaymentRepository.findByTransactionId(transactionId);

  if (!payment) {
    throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
  }
  if (payment.userId.toString() !== userId.toString()) {
    throw new AppError('Payment does not belong to this user', 403, 'PAYMENT_FORBIDDEN');
  }
  if (!isOnlinePayment(payment)) {
    throw new AppError('Only online payments can be confirmed here', 400, 'PAYMENT_METHOD_INVALID');
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

// Khách hàng ghi nhận đã chuyển khoản VietQR để shop owner kiểm tra.
const submitVietQrTransferForUser = async (userId, transactionId) => {
  const payment = await PaymentRepository.findByTransactionId(transactionId);

  if (!payment) {
    throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
  }
  if (payment.userId.toString() !== userId.toString()) {
    throw new AppError('Payment does not belong to this user', 403, 'PAYMENT_FORBIDDEN');
  }
  if (!isOnlinePayment(payment)) {
    throw new AppError('Only online payments can be submitted here', 400, 'PAYMENT_METHOD_INVALID');
  }
  if (payment.status === 'PAID') {
    return {
      payment,
      duplicate: true,
    };
  }

  const event = {
    eventId: `customer-transfer-submitted-${transactionId}`,
    payloadHash: hashPayload({
      transactionId,
      status: 'CUSTOMER_TRANSFER_SUBMITTED',
    }),
    type: 'CUSTOMER_TRANSFER_SUBMITTED',
  };

  const updatedPayment = await PaymentRepository.appendCallbackEvent(transactionId, event);

  return {
    payment: updatedPayment || payment,
    duplicate: !updatedPayment,
  };
};

// Shop owner xác nhận một đơn VietQR đã thanh toán và cập nhật payment tổng nếu đủ điều kiện.
const confirmVietQrPaymentForShopOwner = async (ownerId, orderId) => {
  const shop = await ShopRepository.findApprovedByOwner(ownerId);

  if (!shop) {
    throw new AppError('Approved shop not found for this owner', 403, 'SHOP_NOT_FOUND');
  }

  const order = await OrderRepository.findById(orderId);
  if (!order || order.shopId.toString() !== shop._id.toString()) {
    throw new AppError('Order not found for this shop', 404, 'ORDER_NOT_FOUND');
  }
  if (order.paymentMethod !== 'ONLINE') {
    throw new AppError('Only VietQR orders can be confirmed here', 400, 'PAYMENT_METHOD_INVALID');
  }
  if (order.paymentStatus === 'PAID') {
    return {
      order,
      duplicate: true,
    };
  }

  const payment = await PaymentRepository.findByOrderId(orderId);
  if (!payment || !isOnlinePayment(payment)) {
    throw new AppError('Payment not found for this order', 404, 'PAYMENT_NOT_FOUND');
  }

  const event = {
    eventId: `owner-confirmed-order-${orderId}`,
    payloadHash: hashPayload({
      transactionId: payment.transactionId,
      orderId,
      status: 'OWNER_CONFIRMED_PAID',
    }),
    type: 'OWNER_CONFIRMED_PAID',
    orderId,
  };
  await PaymentRepository.appendCallbackEvent(payment.transactionId, event);

  const updatedOrder = await OrderRepository.updatePaymentStatusById(orderId, 'PAID');
  const relatedOrders = await OrderRepository.findByIds(payment.orderIds || []);

  if (relatedOrders.length > 0 && relatedOrders.every((item) => item.paymentStatus === 'PAID')) {
    await PaymentRepository.setStatus(payment.transactionId, 'PAID');
  }

  return {
    order: updatedOrder,
    duplicate: false,
  };
};

module.exports = {
  createCheckoutPayment,
  handleMockCallback,
  confirmMockPaymentForUser,
  submitVietQrTransferForUser,
  confirmVietQrPaymentForShopOwner,
  signMockCallback,
};
