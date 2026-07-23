const CartRepository = require('../repositories/CartRepository');
const ProductRepository = require('../repositories/ProductRepository');
const AppError = require('../utils/AppError');

// Tìm giỏ hàng hiện có hoặc tạo mới nếu người dùng chưa có giỏ.
const getOrCreateCart = async (userId, options = {}) => {
  const existing = await CartRepository.findByUserId(userId, options);
  return existing || CartRepository.createForUser(userId, options);
};

// Chuẩn hóa dữ liệu giỏ hàng để frontend dễ hiển thị tổng tiền và từng dòng sản phẩm.
const formatCart = (cart) => {
  const items = (cart?.items || [])
    .filter((item) => item.product)
    .map((item) => {
      const product = item.product;
      const lineTotalVnd = product.priceVnd * item.quantity;

      return {
        id: item._id,
        product: {
          id: product._id,
          name: product.name,
          imageUrl: product.imageUrl,
          priceVnd: product.priceVnd,
          stockQuantity: product.stockQuantity,
          status: product.status,
          shop: product.shop,
        },
        quantity: item.quantity,
        lineTotalVnd,
      };
    });

  return {
    id: cart?._id,
    user: cart?.userId,
    items,
    subtotalVnd: items.reduce((sum, item) => sum + item.lineTotalVnd, 0),
  };
};

// Lấy chi tiết giỏ hàng kèm thông tin sản phẩm.
const getCartDetails = async (userId, options = {}) => {
  await getOrCreateCart(userId, options);
  const cart = await CartRepository.findByUserIdWithProducts(userId, options);
  return formatCart(cart);
};

// Thêm sản phẩm vào giỏ sau khi kiểm tra sản phẩm còn bán và đủ tồn kho.
const addToCart = async (userId, productId, quantity) => {
  const product = await ProductRepository.findAvailableById(productId);

  if (!product) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  const cart = await getOrCreateCart(userId);
  const existingCart = await CartRepository.findByUserIdWithProducts(userId);
  const existing = existingCart.items.find((item) => item.productId === productId);
  const nextQuantity = (existing?.quantity || 0) + quantity;

  if (product.stockQuantity < nextQuantity) {
    throw new AppError('Requested quantity exceeds stock', 409, 'INSUFFICIENT_STOCK');
  }

  await CartRepository.addItem(cart.id, productId, quantity);
  return getCartDetails(userId);
};

// Cập nhật số lượng item trong giỏ và kiểm tra lại tồn kho.
const updateItemQuantity = async (userId, itemId, quantity) => {
  const cart = await getOrCreateCart(userId);
  const item = await CartRepository.findItemById(cart.id, itemId);

  if (!item) {
    throw new AppError('Cart item not found', 404, 'CART_ITEM_NOT_FOUND');
  }

  const product = await ProductRepository.findAvailableById(item.productId);
  if (!product) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }
  if (product.stockQuantity < quantity) {
    throw new AppError('Requested quantity exceeds stock', 409, 'INSUFFICIENT_STOCK');
  }

  await CartRepository.updateItemQuantity(itemId, quantity);
  return getCartDetails(userId);
};

// Xóa item khỏi giỏ hàng của đúng người dùng.
const removeCartItem = async (userId, itemId) => {
  const cart = await getOrCreateCart(userId);
  const removed = await CartRepository.removeItem(cart.id, itemId);

  if (!removed) {
    throw new AppError('Cart item not found', 404, 'CART_ITEM_NOT_FOUND');
  }

  return getCartDetails(userId);
};

module.exports = {
  getCartDetails,
  addToCart,
  updateItemQuantity,
  removeCartItem,
  formatCart,
};
