const express = require('express');
const { z } = require('zod');
const PaymentController = require('../controllers/PaymentController');
const validateRequest = require('../middlewares/validateRequest');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

router.post(
  '/mock/callback',
  validateRequest(z.object({
    params: z.object({}),
    query: z.object({}),
    body: z.object({
      transactionId: z.string().trim().min(1).max(180),
      eventId: z.string().trim().min(1).max(180),
      status: z.enum(['PAID', 'FAILED']),
      signature: z.string().trim().min(1),
    }),
  })),
  PaymentController.mockCallback,
);

router.post(
  '/mock/:transactionId/confirm',
  authenticate,
  authorize('CUSTOMER'),
  validateRequest(z.object({
    params: z.object({
      transactionId: z.string().trim().min(1).max(180),
    }),
    query: z.object({}),
    body: z.object({}).optional(),
  })),
  PaymentController.confirmMockPayment,
);

router.post(
  '/vietqr/:transactionId/submit',
  authenticate,
  authorize('CUSTOMER'),
  validateRequest(z.object({
    params: z.object({
      transactionId: z.string().trim().min(1).max(180),
    }),
    query: z.object({}),
    body: z.object({}).optional(),
  })),
  PaymentController.submitVietQrTransfer,
);

router.post(
  '/vietqr/:transactionId/confirm',
  authenticate,
  authorize('CUSTOMER'),
  validateRequest(z.object({
    params: z.object({
      transactionId: z.string().trim().min(1).max(180),
    }),
    query: z.object({}),
    body: z.object({}).optional(),
  })),
  PaymentController.submitVietQrTransfer,
);

router.post(
  '/vietqr/orders/:orderId/confirm',
  authenticate,
  authorize('SHOP_OWNER'),
  validateRequest(z.object({
    params: z.object({
      orderId: objectId,
    }),
    query: z.object({}),
    body: z.object({}).optional(),
  })),
  PaymentController.confirmVietQrOrderPayment,
);

module.exports = router;
