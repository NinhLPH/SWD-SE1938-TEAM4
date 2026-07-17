const express = require('express');
const { z } = require('zod');
const PaymentController = require('../controllers/PaymentController');
const validateRequest = require('../middlewares/validateRequest');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

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

module.exports = router;
