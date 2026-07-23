const { Op } = require('sequelize');
const { InventoryTransaction, Product, User } = require('../models');

// Ghi nhận một giao dịch tồn kho.
const create = (data, options = {}) => InventoryTransaction.create(data, options);

// Liệt kê lịch sử tồn kho của các sản phẩm thuộc owner.
const listForOwner = ({ ownerId, productId, page, limit }) => {
  const offset = (page - 1) * limit;
  const productWhere = {
    createdById: ownerId,
    status: { [Op.ne]: 'DELETED' },
  };

  if (productId) productWhere.id = productId;

  return InventoryTransaction.findAndCountAll({
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'stockQuantity'],
        where: productWhere,
        required: true,
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'fullName', 'email'],
      },
    ],
    order: [['createdAt', 'DESC']],
    offset,
    limit,
  });
};

module.exports = {
  create,
  listForOwner,
};
