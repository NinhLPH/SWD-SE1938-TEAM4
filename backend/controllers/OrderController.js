const OrderService = require('../services/OrderService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const checkout = asyncHandler(async (req, res) => {
  const result = await OrderService.checkout(req.user._id, req.validated.body);
  sendSuccess(res, result, 'Checkout completed', 201);
});

const listMine = asyncHandler(async (req, res) => {
  const orders = await OrderService.listCustomerOrders(req.user._id);
  sendSuccess(res, orders, 'Orders fetched');
});

const getMineDetail = asyncHandler(async (req, res) => {
  const order = await OrderService.getCustomerOrderDetail(req.user._id, req.validated.params.id);
  sendSuccess(res, order, 'Order detail fetched');
});

const listShopOrders = asyncHandler(async (req, res) => {
  const orders = await OrderService.listShopOrders(req.user._id);
  sendSuccess(res, orders, 'Shop orders fetched');
});

const updateStatus = asyncHandler(async (req, res) => {
  const order = await OrderService.updateShopOrderStatus(
    req.user._id,
    req.validated.params.id,
    req.validated.body.status,
  );
  sendSuccess(res, order, 'Order status updated');
});

const cancelMine = asyncHandler(async (req, res) => {
  const order = await OrderService.cancelCustomerOrder(req.user._id, req.validated.params.id);
  sendSuccess(res, order, 'Order cancelled');
});

module.exports = {
  checkout,
  listMine,
  getMineDetail,
  listShopOrders,
  updateStatus,
  cancelMine,
};
