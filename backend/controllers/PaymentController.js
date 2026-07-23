const PaymentService = require('../services/PaymentService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

// Xử lý callback thanh toán mock từ cổng giả lập.
const mockCallback = asyncHandler(async (req, res) => {
  const result = await PaymentService.handleMockCallback(req.validated.body);
  sendSuccess(res, result, result.duplicate ? 'Callback already processed' : 'Callback processed');
});

// Người dùng xác nhận thanh toán mock theo transaction id.
const confirmMockPayment = asyncHandler(async (req, res) => {
  const result = await PaymentService.confirmMockPaymentForUser(
    req.user._id,
    req.validated.params.transactionId,
  );
  sendSuccess(res, result, result.duplicate ? 'Payment already confirmed' : 'Payment confirmed');
});

// Khách hàng báo đã chuyển khoản VietQR.
const submitVietQrTransfer = asyncHandler(async (req, res) => {
  const result = await PaymentService.submitVietQrTransferForUser(
    req.user._id,
    req.validated.params.transactionId,
  );
  sendSuccess(res, result, result.duplicate ? 'Transfer was already submitted' : 'Transfer submitted');
});

// Shop owner xác nhận thanh toán VietQR cho một đơn hàng.
const confirmVietQrOrderPayment = asyncHandler(async (req, res) => {
  const result = await PaymentService.confirmVietQrPaymentForShopOwner(
    req.user._id,
    req.validated.params.orderId,
  );
  sendSuccess(res, result, result.duplicate ? 'Order payment already confirmed' : 'Order payment confirmed');
});

module.exports = {
  mockCallback,
  confirmMockPayment,
  submitVietQrTransfer,
  confirmVietQrOrderPayment,
};
