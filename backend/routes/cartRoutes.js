const express = require('express');
const { z } = require('zod');
const CartController = require('../controllers/CartController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

router.use(authenticate, authorize('CUSTOMER'));

router.get('/', CartController.viewCart);

router.post(
  '/items',
  validateRequest(z.object({
    params: z.object({}),
    query: z.object({}),
    body: z.object({
      productId: objectId,
      quantity: z.coerce.number().int().min(1).max(999),
    }),
  })),
  CartController.addToCart,
);

router.patch(
  '/items/:itemId',
  validateRequest(z.object({
    params: z.object({ itemId: objectId }),
    query: z.object({}),
    body: z.object({
      quantity: z.coerce.number().int().min(1).max(999),
    }),
  })),
  CartController.updateCartItem,
);

router.delete(
  '/items/:itemId',
  validateRequest(z.object({
    params: z.object({ itemId: objectId }),
    query: z.object({}),
    body: z.object({}).optional(),
  })),
  CartController.removeCartItem,
);

module.exports = router;
