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

// Tìm giỏ hàng theo userId, hỗ trợ chạy trong transaction.
const findByUserId = (userId, options = {}) => Cart.findOne({
  where: { userId },
  transaction: options.transaction,
});

// Tìm giỏ hàng kèm item, sản phẩm và shop để tính tiền/checkout.
const findByUserIdWithProducts = (userId, options = {}) => Cart.findOne({
  where: { userId },
  include: includeItems,
  order: [[{ model: CartItem, as: 'items' }, 'createdAt', 'ASC']],
  transaction: options.transaction,
});

// Tạo giỏ hàng mới cho người dùng.
const createForUser = (userId, options = {}) => Cart.create({ userId }, {
  transaction: options.transaction,
});

// Thêm item vào giỏ hoặc cộng dồn số lượng nếu đã có sản phẩm đó.
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

// Cập nhật số lượng item theo id.
const updateItemQuantity = (itemId, quantity, options = {}) => CartItem.update(
  { quantity },
  {
    where: { id: itemId },
    transaction: options.transaction,
  },
);

// Tìm item theo id và cartId để đảm bảo item thuộc đúng giỏ.
const findItemById = (cartId, itemId, options = {}) => CartItem.findOne({
  where: { id: itemId, cartId },
  transaction: options.transaction,
});

// Xóa item khỏi đúng giỏ hàng.
const removeItem = (cartId, itemId, options = {}) => CartItem.destroy({
  where: { id: itemId, cartId },
  transaction: options.transaction,
});

// Xóa toàn bộ item trong giỏ sau khi checkout thành công.
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
