const { Cart, CartItem, Product, Shop } = require('../models');

const includeItems = [{
  model: CartItem,
  as: 'items',
  include: [{
    model: Product,
    as: 'product',
    attributes: ['id', 'name', 'imageUrl', 'priceVnd', 'stockQuantity', 'status', 'shopId'],
    include: [{ model: Shop, as: 'shop', attributes: ['id', 'name', 'ownerId', 'status'] }],
  }],
}];

const findByUserId = (userId, options = {}) => Cart.findOne({
  where: { userId },
  transaction: options.transaction,
});

const findByUserIdWithProducts = (userId, options = {}) => Cart.findOne({
  where: { userId },
  include: includeItems,
  order: [[{ model: CartItem, as: 'items' }, 'createdAt', 'ASC']],
  transaction: options.transaction,
});

const createForUser = (userId, options = {}) => Cart.create({ userId }, {
  transaction: options.transaction,
});

const addItem = async (cartId, productId, quantity, options = {}) => {
  const existing = await CartItem.findOne({
    where: { cartId, productId },
    transaction: options.transaction,
  });

  if (existing) {
    existing.quantity += quantity;
    await existing.save({ transaction: options.transaction });
    return existing;
  }

  return CartItem.create({ cartId, productId, quantity }, {
    transaction: options.transaction,
  });
};

const updateItemQuantity = (itemId, quantity, options = {}) => CartItem.update(
  { quantity },
  {
    where: { id: itemId },
    transaction: options.transaction,
  },
);

const findItemById = (cartId, itemId, options = {}) => CartItem.findOne({
  where: { id: itemId, cartId },
  transaction: options.transaction,
});

const removeItem = (cartId, itemId, options = {}) => CartItem.destroy({
  where: { id: itemId, cartId },
  transaction: options.transaction,
});

const clearCart = async (userId, options = {}) => {
  const cart = await findByUserId(userId, options);
  if (!cart) return { modifiedCount: 0 };
  await CartItem.destroy({
    where: { cartId: cart.id },
    transaction: options.transaction,
  });
  return { modifiedCount: 1 };
};

module.exports = {
  findByUserId,
  findByUserIdWithProducts,
  createForUser,
  addItem,
  updateItemQuantity,
  findItemById,
  removeItem,
  clearCart,
};
