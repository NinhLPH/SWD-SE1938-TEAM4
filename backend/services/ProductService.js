const ProductRepository = require('../repositories/ProductRepository');
const ShopRepository = require('../repositories/ShopRepository');
const AppError = require('../utils/AppError');

const ensureOwnerShop = async (userId) => {
  const shop = await ShopRepository.findApprovedByOwner(userId);

  if (!shop) {
    throw new AppError('Approved shop not found for this owner', 403, 'SHOP_NOT_FOUND');
  }

  return shop;
};

const createProduct = async (ownerId, payload) => {
  const shop = await ensureOwnerShop(ownerId);

  return ProductRepository.create({
    shop: shop._id,
    category: payload.categoryId,
    createdBy: ownerId,
    name: payload.name,
    description: payload.description,
    origin: payload.origin,
    priceVnd: payload.priceVnd,
    stockQuantity: payload.stockQuantity,
    imageUrl: payload.imageUrl,
    status: payload.status || 'ACTIVE',
  });
};

const listMyProducts = async (ownerId, query) => {
  const shop = await ensureOwnerShop(ownerId);
  const page = query.page || 1;
  const limit = query.limit || 12;
  const [items, total] = await ProductRepository.listByShop({ shopId: shop._id, page, limit });

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

const updateMyProduct = async (ownerId, productId, payload) => {
  const product = await ProductRepository.findOwnerProductById(productId, ownerId);

  if (!product) {
    throw new AppError('Product not found or not owned by this shop owner', 404, 'PRODUCT_NOT_FOUND');
  }

  const update = {
    ...payload,
  };

  if (payload.categoryId) {
    update.category = payload.categoryId;
    delete update.categoryId;
  }

  return ProductRepository.updateById(product._id, update);
};

const softDeleteMyProduct = async (ownerId, productId) => {
  const product = await ProductRepository.findOwnerProductById(productId, ownerId);

  if (!product) {
    throw new AppError('Product not found or not owned by this shop owner', 404, 'PRODUCT_NOT_FOUND');
  }

  return ProductRepository.updateById(product._id, { status: 'DELETED' });
};

module.exports = {
  createProduct,
  listMyProducts,
  updateMyProduct,
  softDeleteMyProduct,
};
