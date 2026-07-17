const express = require('express');
const { z } = require('zod');
const AdminController = require('../controllers/AdminController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', AdminController.dashboard);
router.get('/users', AdminController.listUsers);
router.get('/products', AdminController.listProducts);

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);
const userBody = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(300).optional(),
  role: z.enum(['CUSTOMER', 'SHOP_OWNER', 'ADMIN']),
  status: z.enum(['ACTIVE', 'LOCKED']).optional(),
  password: z.string().min(8).max(120),
});

router.post(
  '/users',
  validateRequest(z.object({
    params: z.object({}),
    query: z.object({}),
    body: userBody,
  })),
  AdminController.createUser,
);

router.patch(
  '/users/:id',
  validateRequest(z.object({
    params: z.object({ id: objectId }),
    query: z.object({}),
    body: userBody.partial().refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field is required',
    }),
  })),
  AdminController.updateUser,
);

router.delete(
  '/users/:id',
  validateRequest(z.object({
    params: z.object({ id: objectId }),
    query: z.object({}),
    body: z.object({}).optional(),
  })),
  AdminController.deleteUser,
);

module.exports = router;
