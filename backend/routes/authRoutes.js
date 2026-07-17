const express = require('express');
const { z } = require('zod');
const AuthController = require('../controllers/AuthController');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

router.post(
  '/register',
  validateRequest(z.object({
    body: z.object({
      fullName: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(160),
      phone: z.string().trim().max(20).optional(),
      address: z.string().trim().max(300).optional(),
      password: z.string().min(8).max(120),
      role: z.enum(['CUSTOMER', 'SHOP_OWNER']).optional(),
    }),
    params: z.object({}),
    query: z.object({}),
  })),
  AuthController.register,
);

router.post(
  '/login',
  validateRequest(z.object({
    body: z.object({
      email: z.string().trim().email().max(160),
      password: z.string().min(1).max(120),
    }),
    params: z.object({}),
    query: z.object({}),
  })),
  AuthController.login,
);

module.exports = router;
