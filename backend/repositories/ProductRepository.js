const Product = require('../models/Product');

const create = (data) => Product.create(data);

const findById = (id) => Product.findById(id)
  .populate('shop', 'name owner status')
  .populate('category', 'name slug');

const findOwnerProductById = (id, ownerId) => Product.findOne({
  _id: id,
  createdBy: ownerId,
  status: { $ne: 'DELETED' },
});

const updateById = (id, data) => Product.findByIdAndUpdate(
  id,
  data,
  { returnDocument: 'after', runValidators: true },
).populate('category', 'name slug');

const listByShop = ({ shopId, page, limit }) => {
  const skip = (page - 1) * limit;
  const filter = { shop: shopId, status: { $ne: 'DELETED' } };

  return Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);
};

const searchAvailable = async ({ keyword, categoryId, shopId, minPriceVnd, maxPriceVnd, inStock, minRating, page, limit, sort }) => {
  const skip = (page - 1) * limit;
  const filter = {
    status: 'ACTIVE',
  };

  if (keyword) {
    filter.$text = { $search: keyword };
  }
  if (categoryId) {
    filter.category = categoryId;
  }
  if (shopId) {
    filter.shop = shopId;
  }
  if (minPriceVnd !== undefined || maxPriceVnd !== undefined) {
    filter.priceVnd = {};
    if (minPriceVnd !== undefined) {
      filter.priceVnd.$gte = minPriceVnd;
    }
    if (maxPriceVnd !== undefined) {
      filter.priceVnd.$lte = maxPriceVnd;
    }
  }
  if (inStock === true) {
    filter.stockQuantity = { $gt: 0 };
  }
  if (minRating !== undefined) {
    filter.averageRating = { $gte: minRating };
  }

  const sortMap = {
    newest: { createdAt: -1 },
    price_asc: { priceVnd: 1 },
    price_desc: { priceVnd: -1 },
    rating_desc: { averageRating: -1 },
  };
  const sortBy = keyword ? { score: { $meta: 'textScore' } } : (sortMap[sort] || sortMap.newest);
  const projection = keyword ? { score: { $meta: 'textScore' } } : {};

  const query = Product.find(filter, projection)
    .populate('shop', 'name address status')
    .populate('category', 'name slug')
    .sort(sortBy)
    .skip(skip)
    .limit(limit);

  const [items, total] = await Promise.all([
    query,
    Product.countDocuments(filter),
  ]);

  return [items, total];
};

const findAvailableById = (id) => Product.findOne({ _id: id, status: 'ACTIVE' })
  .populate('shop', 'name description address phone status')
  .populate('category', 'name slug');

const deductStockAtomic = (productId, quantity, options = {}) => Product.updateOne(
  {
    _id: productId,
    status: 'ACTIVE',
    stockQuantity: { $gte: quantity },
  },
  {
    $inc: { stockQuantity: -quantity },
  },
  options,
);

module.exports = {
  create,
  findById,
  findOwnerProductById,
  updateById,
  listByShop,
  searchAvailable,
  findAvailableById,
  deductStockAtomic,
};
