const { DataTypes } = require('sequelize');
const connectDB = require('../config/db');
const { idField, withLegacyJson } = require('./modelUtils');

const InventoryTransaction = connectDB.sequelize.define('InventoryTransaction', {
  id: idField,
  productId: {
    type: DataTypes.STRING(24),
    allowNull: false,
  },
  userId: {
    type: DataTypes.STRING(24),
    allowNull: false,
  },
  transactionType: {
    type: DataTypes.ENUM('STOCK_IN'),
    allowNull: false,
    defaultValue: 'STOCK_IN',
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { isInt: true, min: 1 },
  },
  quantityBefore: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { isInt: true, min: 0 },
  },
  quantityAfter: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { isInt: true, min: 0 },
  },
  note: DataTypes.STRING(300),
}, {
  tableName: 'inventory_transactions',
  indexes: [
    { fields: ['product_id', 'created_at'] },
    { fields: ['user_id', 'created_at'] },
    { fields: ['transaction_type', 'created_at'] },
  ],
});

module.exports = withLegacyJson(InventoryTransaction);
