const AdminService = require('../services/AdminService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const dashboard = asyncHandler(async (req, res) => {
  const data = await AdminService.getDashboard();
  sendSuccess(res, data, 'Admin dashboard fetched');
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await AdminService.listUsers();
  sendSuccess(res, users, 'Users fetched');
});

const listProducts = asyncHandler(async (req, res) => {
  const products = await AdminService.listProducts();
  sendSuccess(res, products, 'Products fetched');
});

const createUser = asyncHandler(async (req, res) => {
  const user = await AdminService.createUser(req.validated.body);
  sendSuccess(res, user, 'User created', 201);
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await AdminService.updateUser(req.validated.params.id, req.validated.body);
  sendSuccess(res, user, 'User updated');
});

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
