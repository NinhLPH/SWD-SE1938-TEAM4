const CartService = require('../services/CartService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const viewCart = asyncHandler(async (req, res) => {
  const cart = await CartService.getCartDetails(req.user._id);
  sendSuccess(res, cart, 'Cart fetched');
});

const addToCart = asyncHandler(async (req, res) => {
  const cart = await CartService.addToCart(
    req.user._id,
    req.validated.body.productId,
    req.validated.body.quantity,
  );
  sendSuccess(res, cart, 'Cart item added', 201);
});

const updateCartItem = asyncHandler(async (req, res) => {
  const cart = await CartService.updateItemQuantity(
    req.user._id,
    req.validated.params.itemId,
    req.validated.body.quantity,
  );
  sendSuccess(res, cart, 'Cart item updated');
});

const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await CartService.removeCartItem(req.user._id, req.validated.params.itemId);
  sendSuccess(res, cart, 'Cart item removed');
});

module.exports = {
  viewCart,
  addToCart,
  updateCartItem,
  removeCartItem,
};
