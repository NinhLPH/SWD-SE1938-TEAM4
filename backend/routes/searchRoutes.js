const express = require('express');
const { z } = require('zod');
const SearchController = require('../controllers/SearchController');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

router.get(
  '/categories',
  validateRequest(z.object({
    params: z.object({}),
    body: z.object({}).optional(),
    query: z.object({}),
  })),
  SearchController.listCategories,
);

router.get(
  '/products',
  validateRequest(z.object({
    params: z.object({}),
    body: z.object({}).optional(),
    query: z.object({
      keyword: z.string().trim().max(100).optional(),
      categoryId: objectId.optional(),
      shopId: objectId.optional(),
      minPriceVnd: z.coerce.number().int().min(0).optional(),
      maxPriceVnd: z.coerce.number().int().min(0).optional(),
      inStock: z.coerce.boolean().optional(),
      minRating: z.coerce.number().min(0).max(5).optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(12),
      sort: z.enum(['newest', 'price_asc', 'price_desc', 'rating_desc']).default('newest'),
    }).refine((value) => {
      if (value.minPriceVnd === undefined || value.maxPriceVnd === undefined) {
        return true;
      }
      return value.minPriceVnd <= value.maxPriceVnd;
    }, { message: 'minPriceVnd must be less than or equal to maxPriceVnd' }),
  })),
  SearchController.searchProducts,
);

router.get(
  '/products/:id',
  validateRequest(z.object({
    params: z.object({ id: objectId }),
    body: z.object({}).optional(),
    query: z.object({}),
  })),
  SearchController.getProductDetail,
);

module.exports = router;
