const ProductService = require('../services/ProductService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

// Shop owner tạo sản phẩm mới.
const createProduct = asyncHandler(async (req, res) => {
  const product = await ProductService.createProduct(req.user._id, req.validated.body);
  sendSuccess(res, product, 'Product created', 201);
});

// Shop owner lấy danh sách sản phẩm của shop mình.
const listMyProducts = asyncHandler(async (req, res) => {
  const result = await ProductService.listMyProducts(req.user._id, req.validated.query);
  sendSuccess(res, result.items, 'Products fetched', 200, result.meta);
});

// Shop owner cập nhật sản phẩm thuộc shop mình.
const updateMyProduct = asyncHandler(async (req, res) => {
  const product = await ProductService.updateMyProduct(
    req.user._id,
    req.validated.params.id,
    req.validated.body,
  );
  sendSuccess(res, product, 'Product updated');
});

// Shop owner nhập thêm tồn kho cho sản phẩm.
const addStock = asyncHandler(async (req, res) => {
  const result = await ProductService.addStock(
    req.user._id,
    req.validated.params.id,
    req.validated.body,
  );
  sendSuccess(res, result, 'Stock imported');
});

// Shop owner xem lịch sử nhập kho.
const listStockTransactions = asyncHandler(async (req, res) => {
  const result = await ProductService.listStockTransactions(req.user._id, req.validated.query);
  sendSuccess(res, result.items, 'Stock history fetched', 200, result.meta);
});

// Shop owner ẩn/xóa mềm sản phẩm của mình.
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
