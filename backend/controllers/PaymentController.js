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

module.exports = {
  mockCallback,
  confirmMockPayment,
};
