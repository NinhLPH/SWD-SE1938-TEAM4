const AuthService = require('../services/AuthService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

// Đăng ký tài khoản mới và trả về thông tin đăng nhập.
const register = asyncHandler(async (req, res) => {
  const result = await AuthService.register(req.validated.body);
  sendSuccess(res, result, 'Registered successfully', 201);
});

// Xác thực email/mật khẩu và trả về token.
const login = asyncHandler(async (req, res) => {
  const result = await AuthService.login(req.validated.body);
  sendSuccess(res, result, 'Logged in successfully');
});

module.exports = {
  register,
  login,
};
