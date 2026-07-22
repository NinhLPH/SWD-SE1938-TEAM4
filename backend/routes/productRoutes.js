const express = require('express');
const { z } = require('zod');
const ProductController = require('../controllers/ProductController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);
const productBody = z.object({
  categoryId: objectId,
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2000).optional(),
  origin: z.string().trim().max(100).optional(),
  priceVnd: z.coerce.number().int().min(0),
  stockQuantity: z.coerce.number().int().min(0),
  imageUrl: z.string().trim().url().max(1000).optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'HIDDEN', 'SUSPENDED']).optional(),
});
const updateProductBody = productBody.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required',
});

router.use(authenticate, authorize('SHOP_OWNER'));

router.get(
  '/mine',
  validateRequest(z.object({
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(12),
    }),
    params: z.object({}),
    body: z.object({}).optional(),
  })),
  ProductController.listMyProducts,
);

router.get(
  '/stock-transactions',
  validateRequest(z.object({
    query: z.object({
      productId: objectId.optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
    params: z.object({}),
    body: z.object({}).optional(),
  })),
  ProductController.listStockTransactions,
);

router.post(
  '/',
  validateRequest(z.object({
    body: productBody,
    query: z.object({}),
    params: z.object({}),
  })),
  ProductController.createProduct,
);

router.post(
  '/:id/stock-in',
  validateRequest(z.object({
    params: z.object({ id: objectId }),
    query: z.object({}),
    body: z.object({
      quantity: z.coerce.number().int().min(1).max(100000),
      note: z.string().trim().max(300).optional().or(z.literal('')),
    }),
  })),
  ProductController.addStock,
);

router.patch(
  '/:id',
  validateRequest(z.object({
    params: z.object({ id: objectId }),
    body: updateProductBody,
    query: z.object({}),
  })),
  ProductController.updateMyProduct,
);

router.delete(
  '/:id',
  validateRequest(z.object({
    params: z.object({ id: objectId }),
    body: z.object({}).optional(),
    query: z.object({}),
  })),
  ProductController.deleteMyProduct,
);

module.exports = router;
