const { DataTypes } = require('sequelize');
const connectDB = require('../config/db');
const { idField, withLegacyJson } = require('./modelUtils');

const Shop = connectDB.sequelize.define('Shop', {
  id: idField,
  ownerId: {
    type: DataTypes.STRING(24),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { len: [2, 150] },
  },
  description: DataTypes.STRING(1000),
  address: {
    type: DataTypes.STRING(300),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'LOCKED'),
    allowNull: false,
    defaultValue: 'APPROVED',
  },
}, {
  tableName: 'shops',
  indexes: [
    { fields: ['owner_id', 'status'] },
    { fields: ['status'] },
  ],
});

module.exports = withLegacyJson(Shop);
