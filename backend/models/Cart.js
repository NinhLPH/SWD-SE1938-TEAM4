const { DataTypes } = require('sequelize');
const connectDB = require('../config/db');
const { idField, withLegacyJson } = require('./modelUtils');

const Cart = connectDB.sequelize.define('Cart', {
  id: idField,
  userId: {
    type: DataTypes.STRING(24),
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'carts',
  indexes: [
    { fields: ['user_id'], unique: true },
  ],
});

const CartItem = connectDB.sequelize.define('CartItem', {
  id: idField,
  cartId: {
    type: DataTypes.STRING(24),
    allowNull: false,
  },
  productId: {
    type: DataTypes.STRING(24),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
}, {
  tableName: 'cart_items',
  indexes: [
    { fields: ['cart_id'] },
    { fields: ['product_id'] },
    { fields: ['cart_id', 'product_id'], unique: true },
  ],
});

Cart.CartItem = withLegacyJson(CartItem);

module.exports = withLegacyJson(Cart);
