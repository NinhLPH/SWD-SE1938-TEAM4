const CartRepository = require('../repositories/CartRepository');
const ProductRepository = require('../repositories/ProductRepository');
const AppError = require('../utils/AppError');

const getOrCreateCart = async (userId) => {
  const existing = await CartRepository.findByUserId(userId);
  return existing || CartRepository.createForUser(userId);
};

const formatCart = (cart) => {
  const items = cart.items
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
    id: cart._id,
    user: cart.user,
    items,
    subtotalVnd: items.reduce((sum, item) => sum + item.lineTotalVnd, 0),
  };
};

const getCartDetails = async (userId) => {
  await getOrCreateCart(userId);
  const cart = await CartRepository.findByUserIdWithProducts(userId);
  return formatCart(cart);
};

const addToCart = async (userId, productId, quantity) => {
  const product = await ProductRepository.findAvailableById(productId);

  if (!product) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }
  if (product.stockQuantity < quantity) {
    throw new AppError('Requested quantity exceeds stock', 409, 'INSUFFICIENT_STOCK');
  }

  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((item) => item.product.toString() === productId);

  if (existing) {
    const nextQuantity = existing.quantity + quantity;
    if (product.stockQuantity < nextQuantity) {
      throw new AppError('Requested quantity exceeds stock', 409, 'INSUFFICIENT_STOCK');
    }
    existing.quantity = nextQuantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }

  await CartRepository.save(cart);
  return getCartDetails(userId);
};

const updateItemQuantity = async (userId, itemId, quantity) => {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.id(itemId);

  if (!item) {
    throw new AppError('Cart item not found', 404, 'CART_ITEM_NOT_FOUND');
  }

  const product = await ProductRepository.findAvailableById(item.product);
  if (!product) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }
  if (product.stockQuantity < quantity) {
    throw new AppError('Requested quantity exceeds stock', 409, 'INSUFFICIENT_STOCK');
  }

  item.quantity = quantity;
  await CartRepository.save(cart);
  return getCartDetails(userId);
};

const removeCartItem = async (userId, itemId) => {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.id(itemId);

  if (!item) {
    throw new AppError('Cart item not found', 404, 'CART_ITEM_NOT_FOUND');
  }

  item.deleteOne();
  await CartRepository.save(cart);
  return getCartDetails(userId);
};

module.exports = {
  getCartDetails,
  addToCart,
  updateItemQuantity,
  removeCartItem,
};
