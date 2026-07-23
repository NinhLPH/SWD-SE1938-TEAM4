const AppError = require('../utils/AppError');

// Chuyển các route không tồn tại thành AppError 404.
const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND'));
};

// Chuẩn hóa mọi lỗi thành response JSON thống nhất.
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      details: err.details,
    },
  });
};

module.exports = {
  notFound,
  errorHandler,
};
