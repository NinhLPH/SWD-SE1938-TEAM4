const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new AppError('Authentication token is required', 401, 'AUTH_REQUIRED');
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user = await User.findById(payload.sub).select('-passwordHash');

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('User is inactive or no longer exists', 401, 'AUTH_INVALID');
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Invalid authentication token', 401, 'AUTH_INVALID'));
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication is required', 401, 'AUTH_REQUIRED'));
  }

  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission for this action', 403, 'FORBIDDEN'));
  }

  return next();
};

module.exports = {
  authenticate,
  authorize,
};
