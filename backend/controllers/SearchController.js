const SearchService = require('../services/SearchService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const searchProducts = asyncHandler(async (req, res) => {
  const result = await SearchService.searchProducts(req.validated.query);
  sendSuccess(res, result.items, 'Products fetched', 200, result.meta);
});

const getProductDetail = asyncHandler(async (req, res) => {
  const product = await SearchService.getProductDetail(req.validated.params.id);
  sendSuccess(res, product, 'Product fetched');
});

const listCategories = asyncHandler(async (req, res) => {
  const categories = await SearchService.listCategories();
  sendSuccess(res, categories, 'Categories fetched');
});

module.exports = {
  searchProducts,
  getProductDetail,
  listCategories,
};
