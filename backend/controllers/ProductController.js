const ProductService = require('../services/ProductService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const createProduct = asyncHandler(async (req, res) => {
  const product = await ProductService.createProduct(req.user._id, req.validated.body);
  sendSuccess(res, product, 'Product created', 201);
});

const listMyProducts = asyncHandler(async (req, res) => {
  const result = await ProductService.listMyProducts(req.user._id, req.validated.query);
  sendSuccess(res, result.items, 'Products fetched', 200, result.meta);
});

const updateMyProduct = asyncHandler(async (req, res) => {
  const product = await ProductService.updateMyProduct(
    req.user._id,
    req.validated.params.id,
    req.validated.body,
  );
  sendSuccess(res, product, 'Product updated');
});

const addStock = asyncHandler(async (req, res) => {
  const result = await ProductService.addStock(
    req.user._id,
    req.validated.params.id,
    req.validated.body,
  );
  sendSuccess(res, result, 'Stock imported');
});

const listStockTransactions = asyncHandler(async (req, res) => {
  const result = await ProductService.listStockTransactions(req.user._id, req.validated.query);
  sendSuccess(res, result.items, 'Stock history fetched', 200, result.meta);
});

const deleteMyProduct = asyncHandler(async (req, res) => {
  const product = await ProductService.softDeleteMyProduct(req.user._id, req.validated.params.id);
  sendSuccess(res, product, 'Product deleted');
});

module.exports = {
  createProduct,
  listMyProducts,
  updateMyProduct,
  addStock,
  listStockTransactions,
  deleteMyProduct,
};
