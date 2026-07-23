const ProductRepository = require('../repositories/ProductRepository');
const { Category } = require('../models');
const AppError = require('../utils/AppError');

// Tìm kiếm sản phẩm đang bán theo query và trả kèm metadata phân trang.
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

// Lấy chi tiết sản phẩm công khai, báo lỗi nếu sản phẩm không tồn tại/không bán.
const getProductDetail = async (productId) => {
  const product = await ProductRepository.findAvailableById(productId);

  if (!product) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  return product;
};

// Lấy danh mục đang hoạt động để frontend dùng trong bộ lọc.
const listCategories = () => Category.findAll({
  where: { status: 'ACTIVE' },
  order: [['name', 'ASC']],
});

module.exports = {
  searchProducts,
  getProductDetail,
  listCategories,
};
