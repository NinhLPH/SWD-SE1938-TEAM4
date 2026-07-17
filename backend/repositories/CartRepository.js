const Cart = require('../models/Cart');

const findByUserId = (userId) => Cart.findOne({ user: userId });

const findByUserIdWithProducts = (userId, options = {}) => Cart.findOne({ user: userId })
  .populate({
    path: 'items.product',
    select: 'name imageUrl priceVnd stockQuantity status shop',
    populate: { path: 'shop', select: 'name owner status' },
  })
  .session(options.session || null);

const createForUser = (userId) => Cart.create({ user: userId, items: [] });

const save = (cart, options = {}) => cart.save(options);

const clearCart = (userId, options = {}) => Cart.updateOne({ user: userId }, { $set: { items: [] } }, options);

module.exports = {
  findByUserId,
  findByUserIdWithProducts,
  createForUser,
  save,
  clearCart,
};
