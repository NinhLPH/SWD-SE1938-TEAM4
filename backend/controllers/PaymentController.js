const PaymentService = require('../services/PaymentService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const mockCallback = asyncHandler(async (req, res) => {
  const result = await PaymentService.handleMockCallback(req.validated.body);
  sendSuccess(res, result, result.duplicate ? 'Callback already processed' : 'Callback processed');
});

const confirmMockPayment = asyncHandler(async (req, res) => {
  const result = await PaymentService.confirmMockPaymentForUser(
    req.user._id,
    req.validated.params.transactionId,
  );
  sendSuccess(res, result, result.duplicate ? 'Payment already confirmed' : 'Payment confirmed');
});

const submitVietQrTransfer = asyncHandler(async (req, res) => {
  const result = await PaymentService.submitVietQrTransferForUser(
    req.user._id,
    req.validated.params.transactionId,
  );
  sendSuccess(res, result, result.duplicate ? 'Transfer was already submitted' : 'Transfer submitted');
});

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
