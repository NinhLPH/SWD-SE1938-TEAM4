const ProductRepository = require('../repositories/ProductRepository');
const ShopRepository = require('../repositories/ShopRepository');
const InventoryTransactionRepository = require('../repositories/InventoryTransactionRepository');
const connectDB = require('../config/db');
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
    shopId: shop._id,
    categoryId: payload.categoryId,
    createdById: ownerId,
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

  return ProductRepository.updateById(product._id, update);
};

const addStock = (ownerId, productId, payload) => connectDB.sequelize.transaction(async (transaction) => {
  const product = await ProductRepository.findOwnerProductById(productId, ownerId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!product) {
    throw new AppError('Product not found or not owned by this shop owner', 404, 'PRODUCT_NOT_FOUND');
  }

  const quantity = Number(payload.quantity);
  const quantityBefore = Number(product.stockQuantity || 0);
  const quantityAfter = quantityBefore + quantity;

  await product.update({ stockQuantity: quantityAfter }, { transaction });
  const stockTransaction = await InventoryTransactionRepository.create({
    productId: product._id,
    userId: ownerId,
    transactionType: 'STOCK_IN',
    quantity,
    quantityBefore,
    quantityAfter,
    note: payload.note || null,
  }, { transaction });

  return {
    product,
    stockTransaction,
  };
});

const listStockTransactions = async (ownerId, query) => {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const result = await InventoryTransactionRepository.listForOwner({
    ownerId,
    productId: query.productId,
    page,
    limit,
  });

  return {
    items: result.rows,
    meta: {
      page,
      limit,
      total: result.count,
      totalPages: Math.max(Math.ceil(result.count / limit), 1),
    },
  };
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
  addStock,
  listStockTransactions,
  softDeleteMyProduct,
};
