const SearchService = require('../services/SearchService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

// Tìm kiếm sản phẩm công khai theo bộ lọc catalog.
const searchProducts = asyncHandler(async (req, res) => {
  const result = await SearchService.searchProducts(req.validated.query);
  sendSuccess(res, result.items, 'Products fetched', 200, result.meta);
});

// Lấy chi tiết sản phẩm công khai theo id.
const getProductDetail = asyncHandler(async (req, res) => {
  const product = await SearchService.getProductDetail(req.validated.params.id);
  sendSuccess(res, product, 'Product fetched');
});

// Lấy danh sách danh mục sản phẩm công khai.
const listCategories = asyncHandler(async (req, res) => {
  const categories = await SearchService.listCategories();
  sendSuccess(res, categories, 'Categories fetched');
});

module.exports = {
  searchProducts,
  getProductDetail,
  listCategories,
};
