const { DataTypes } = require('sequelize');
const connectDB = require('../config/db');
const { idField, withLegacyJson } = require('./modelUtils');

const Category = connectDB.sequelize.define('Category', {
  id: idField,
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  slug: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    allowNull: false,
    defaultValue: 'ACTIVE',
  },
}, {
  tableName: 'categories',
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['status'] },
    { fields: ['name'] },
  ],
});

module.exports = withLegacyJson(Category);
