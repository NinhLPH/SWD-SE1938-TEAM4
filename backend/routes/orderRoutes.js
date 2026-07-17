const express = require('express');
const { z } = require('zod');
const OrderController = require('../controllers/OrderController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

router.get(
  '/mine',
  authenticate,
  authorize('CUSTOMER'),
  OrderController.listMine,
);

router.get(
  '/shop',
  authenticate,
  authorize('SHOP_OWNER'),
  OrderController.listShopOrders,
);

router.post(
  '/checkout',
  authenticate,
  authorize('CUSTOMER'),
  validateRequest(z.object({
    params: z.object({}),
    query: z.object({}),
    body: z.object({
      paymentMethod: z.enum(['COD', 'ONLINE']),
      shippingAddress: z.object({
        fullName: z.string().trim().min(2).max(120),
        phone: z.string().trim().min(8).max(20),
        address: z.string().trim().min(5).max(300),
      }),
    }),
  })),
  OrderController.checkout,
);

router.patch(
  '/:id/status',
  authenticate,
  authorize('SHOP_OWNER'),
  validateRequest(z.object({
    params: z.object({ id: objectId }),
    query: z.object({}),
    body: z.object({
      status: z.enum(['CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED']),
    }),
  })),
  OrderController.updateStatus,
);

module.exports = router;
