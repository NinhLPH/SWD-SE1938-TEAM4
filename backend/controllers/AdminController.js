const AdminService = require('../services/AdminService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

// Trả về số liệu tổng quan cho màn hình admin.
const dashboard = asyncHandler(async (req, res) => {
  const data = await AdminService.getDashboard();
  sendSuccess(res, data, 'Admin dashboard fetched');
});

// Trả về danh sách tài khoản để admin quản lý.
const listUsers = asyncHandler(async (req, res) => {
  const users = await AdminService.listUsers();
  sendSuccess(res, users, 'Users fetched');
});

// Trả về toàn bộ sản phẩm để admin theo dõi theo shop.
const listProducts = asyncHandler(async (req, res) => {
  const products = await AdminService.listProducts();
  sendSuccess(res, products, 'Products fetched');
});

// Tạo tài khoản mới từ dữ liệu đã validate.
const createUser = asyncHandler(async (req, res) => {
  const user = await AdminService.createUser(req.validated.body);
  sendSuccess(res, user, 'User created', 201);
});

// Cập nhật thông tin tài khoản theo id.
const updateUser = asyncHandler(async (req, res) => {
  const user = await AdminService.updateUser(req.validated.params.id, req.validated.body);
  sendSuccess(res, user, 'User updated');
});

// Khóa tài khoản người dùng theo id.
const deleteUser = asyncHandler(async (req, res) => {
  const user = await AdminService.lockUser(req.validated.params.id);
  sendSuccess(res, user, 'User locked');
});

module.exports = {
  dashboard,
  listUsers,
  listProducts,
  createUser,
  updateUser,
  deleteUser,
};
