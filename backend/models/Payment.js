const { DataTypes } = require('sequelize');
const connectDB = require('../config/db');
const { idField, withLegacyJson } = require('./modelUtils');

const parseJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};

const Payment = connectDB.sequelize.define('Payment', {
  id: idField,
  orderIds: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
    get() {
      return parseJsonArray(this.getDataValue('orderIds'));
    },
    set(value) {
      this.setDataValue('orderIds', JSON.stringify(value || []));
    },
  },
  orders: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('orderIds') || [];
    },
    set(value) {
      this.setDataValue('orderIds', value);
    },
  },
  userId: { type: DataTypes.STRING(24), allowNull: false },
  provider: {
    type: DataTypes.ENUM('COD', 'MOMO', 'VNPAY', 'MOCK'),
    allowNull: false,
  },
  transactionId: {
    type: DataTypes.STRING(180),
    allowNull: false,
    unique: true,
  },
  amountVnd: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  callbackEvents: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
    get() {
      return parseJsonArray(this.getDataValue('callbackEvents'));
    },
    set(value) {
      this.setDataValue('callbackEvents', JSON.stringify(value || []));
    },
  },
}, {
  tableName: 'payments',
  indexes: [
    { fields: ['transaction_id'], unique: true },
    { fields: ['user_id', 'status'] },
    { fields: ['provider', 'status'] },
  ],
});

module.exports = withLegacyJson(Payment);
