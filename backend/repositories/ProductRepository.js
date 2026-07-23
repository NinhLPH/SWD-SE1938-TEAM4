const { Op } = require('sequelize');
const { Category, Product, Shop, User } = require('../models');

const includes = [
  { model: Shop, as: 'shop', attributes: ['id', 'name', 'ownerId', 'status', 'address', 'phone', 'description'] },
  { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
];

// Tạo bản ghi sản phẩm mới.
const create = (data, options = {}) => Product.create(data, options);

// Tìm sản phẩm theo id kèm shop và category.
const findById = (id, options = {}) => Product.findByPk(id, { include: includes, ...options });

// Tìm sản phẩm thuộc owner và chưa bị xóa mềm.
const findOwnerProductById = (id, ownerId, options = {}) => Product.findOne({
  where: {
    id,
    createdById: ownerId,
    status: { [Op.ne]: 'DELETED' },
  },
  ...options,
});

// Cập nhật sản phẩm theo id rồi trả lại dữ liệu mới kèm category.
const updateById = async (id, data, options = {}) => {
  const product = await Product.findByPk(id);
  if (!product) return null;
  await product.update(data, options);
  return Product.findByPk(id, { include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }] });
};

// Liệt kê sản phẩm của một shop với phân trang.
const listByShop = ({ shopId, page, limit }) => {
  const offset = (page - 1) * limit;
  const where = { shopId, status: { [Op.ne]: 'DELETED' } };

  return Promise.all([
    Product.findAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
    }),
    Product.count({ where }),
  ]);
};

// Tìm sản phẩm ACTIVE theo nhiều bộ lọc catalog và sort.
const searchAvailable = async ({ keyword, categoryId, shopId, minPriceVnd, maxPriceVnd, inStock, minRating, page, limit, sort }) => {
  const offset = (page - 1) * limit;
  const where = { status: 'ACTIVE' };

  if (keyword) {
    where[Op.or] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { description: { [Op.like]: `%${keyword}%` } },
      { origin: { [Op.like]: `%${keyword}%` } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (shopId) where.shopId = shopId;
  if (minPriceVnd !== undefined || maxPriceVnd !== undefined) {
    where.priceVnd = {};
    if (minPriceVnd !== undefined) where.priceVnd[Op.gte] = minPriceVnd;
    if (maxPriceVnd !== undefined) where.priceVnd[Op.lte] = maxPriceVnd;
  }
  if (inStock === true) where.stockQuantity = { [Op.gt]: 0 };
  if (minRating !== undefined) where.averageRating = { [Op.gte]: minRating };

  const orderMap = {
    newest: [['createdAt', 'DESC']],
    price_asc: [['priceVnd', 'ASC']],
    price_desc: [['priceVnd', 'DESC']],
    rating_desc: [['averageRating', 'DESC']],
  };

  const [items, total] = await Promise.all([
    Product.findAll({
      where,
      include: includes,
      order: orderMap[sort] || orderMap.newest,
      offset,
      limit,
    }),
    Product.count({ where }),
  ]);

  return [items, total];
};

// Tìm sản phẩm đang bán theo id.
const findAvailableById = (id) => Product.findOne({
  where: { id, status: 'ACTIVE' },
  include: includes,
});

// Trừ tồn kho theo điều kiện đủ hàng để tránh oversell trong checkout.
const deductStockAtomic = async (productId, quantity, options = {}) => {
  const [affectedCount] = await Product.update(
    { stockQuantity: Product.sequelize.literal(`stock_quantity - ${Number(quantity)}`) },
    {
      where: {
        id: productId,
        status: 'ACTIVE',
        stockQuantity: { [Op.gte]: quantity },
      },
      transaction: options.transaction,
    },
  );

  return { modifiedCount: affectedCount };
};

// Hoàn tồn kho cho nhiều item khi đơn bị hủy.
const restoreStockMany = (items, options = {}) => Promise.all(items.map((item) => Product.increment(
  { stockQuantity: Number(item.quantity) },
  {
    where: { id: item.productId },
    transaction: options.transaction,
  },
)));

// Lấy toàn bộ sản phẩm kèm shop, category và người tạo cho admin.
const listAllForAdmin = () => Product.findAll({
  include: [
    { model: Shop, as: 'shop', attributes: ['id', 'name'] },
    { model: Category, as: 'category', attributes: ['id', 'name'] },
    { model: User, as: 'createdBy', attributes: ['id', 'fullName', 'email'] },
  ],
  order: [['createdAt', 'DESC']],
});

module.exports = {
  create,
  findById,
  findOwnerProductById,
  updateById,
  listByShop,
  searchAvailable,
  findAvailableById,
  deductStockAtomic,
  restoreStockMany,
  listAllForAdmin,
};
