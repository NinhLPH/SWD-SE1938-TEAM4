const { DataTypes } = require('sequelize');
const connectDB = require('../config/db');
const { idField, withLegacyJson } = require('./modelUtils');

const User = connectDB.sequelize.define('User', {
  id: idField,
  fullName: {
    type: DataTypes.STRING(120),
    allowNull: false,
    validate: { len: [2, 120] },
  },
  email: {
    type: DataTypes.STRING(160),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
    set(value) {
      this.setDataValue('email', String(value).toLowerCase().trim());
    },
  },
  phone: DataTypes.STRING(20),
  address: DataTypes.STRING(300),
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('CUSTOMER', 'SHOP_OWNER', 'ADMIN'),
    allowNull: false,
    defaultValue: 'CUSTOMER',
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'LOCKED'),
    allowNull: false,
    defaultValue: 'ACTIVE',
  },
}, {
  tableName: 'users',
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['role', 'status'] },
  ],
});

module.exports = withLegacyJson(User);
