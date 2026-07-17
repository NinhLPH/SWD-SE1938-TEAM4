const ProductRepository = require('../repositories/ProductRepository');
const Category = require('../models/Category');
const AppError = require('../utils/AppError');

const searchProducts = async (query) => {
  const page = query.page || 1;
  const limit = query.limit || 12;
  const [items, total] = await ProductRepository.searchAvailable({
    ...query,
    page,
    limit,
  });

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getProductDetail = async (productId) => {
  const product = await ProductRepository.findAvailableById(productId);

  if (!product) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  return product;
};

const listCategories = () => Category.find({ status: 'ACTIVE' }).sort({ name: 1 });

module.exports = {
  searchProducts,
  getProductDetail,
  listCategories,
};
