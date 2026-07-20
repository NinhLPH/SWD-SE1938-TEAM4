const { DataTypes } = require('sequelize');
const connectDB = require('../config/db');
const { idField, withLegacyJson } = require('./modelUtils');

const Product = connectDB.sequelize.define('Product', {
  id: idField,
  shopId: { type: DataTypes.STRING(24), allowNull: false },
  categoryId: { type: DataTypes.STRING(24), allowNull: false },
  createdById: { type: DataTypes.STRING(24), allowNull: false },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { len: [2, 150] },
  },
  description: DataTypes.TEXT,
  origin: DataTypes.STRING(100),
  priceVnd: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: 'priceVnd must be an integer amount in VND' },
      min: 0,
    },
  },
  stockQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: 'stockQuantity must be an integer' },
      min: 0,
    },
  },
  imageUrl: DataTypes.STRING(1000),
  averageRating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: false,
    defaultValue: 0,
    get() {
      return Number(this.getDataValue('averageRating'));
    },
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'HIDDEN', 'SUSPENDED', 'DELETED'),
    allowNull: false,
    defaultValue: 'ACTIVE',
  },
}, {
  tableName: 'products',
  indexes: [
    { fields: ['shop_id', 'status'] },
    { fields: ['category_id', 'status'] },
    { fields: ['created_by_id'] },
    { fields: ['price_vnd', 'status'] },
    { fields: ['stock_quantity', 'status'] },
    { fields: ['average_rating', 'status'] },
    { fields: ['name'] },
  ],
});

module.exports = withLegacyJson(Product);
