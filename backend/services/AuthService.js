const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');
const AppError = require('../utils/AppError');

const signToken = (user) => jwt.sign(
  {
    sub: user._id.toString(),
    role: user.role,
  },
  process.env.JWT_SECRET || 'dev-secret',
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
);

const sanitizeUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  address: user.address,
  role: user.role,
  status: user.status,
});

const register = async (payload) => {
  const existing = await UserRepository.findByEmail(payload.email);

  if (existing) {
    throw new AppError('Email is already registered', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await UserRepository.create({
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    address: payload.address,
    passwordHash,
    role: payload.role || 'CUSTOMER',
  });

  return {
    user: sanitizeUser(user),
    token: signToken(user),
  };
};

const login = async ({ email, password }) => {
  const user = await UserRepository.findByEmail(email);

  if (!user || user.status !== 'ACTIVE') {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  return {
    user: sanitizeUser(user),
    token: signToken(user),
  };
};

module.exports = {
  register,
  login,
  sanitizeUser,
};
