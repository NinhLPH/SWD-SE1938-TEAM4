const AppError = require('../utils/AppError');

// Validate body/params/query bằng schema và lưu dữ liệu sạch vào req.validated.
const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    const error = new AppError('Invalid request data', 400, 'VALIDATION_ERROR');
    error.details = result.error.flatten();
    return next(error);
  }

  req.validated = result.data;
  return next();
};

module.exports = validateRequest;
