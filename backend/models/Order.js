const { DataTypes } = require('sequelize');
const connectDB = require('../config/db');
const { idField, withLegacyJson } = require('./modelUtils');

const Order = connectDB.sequelize.define('Order', {
  id: idField,
  userId: { type: DataTypes.STRING(24), allowNull: false },
  shopId: { type: DataTypes.STRING(24), allowNull: false },
  totalAmountVnd: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { isInt: true, min: 0 },
  },
  paymentMethod: {
    type: DataTypes.ENUM('COD', 'ONLINE'),
    allowNull: false,
  },
  paymentStatus: {
    type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  shippingFullName: { type: DataTypes.STRING(120), allowNull: false },
  shippingPhone: { type: DataTypes.STRING(20), allowNull: false },
  shippingAddressText: { type: DataTypes.STRING(300), allowNull: false },
  shippingAddress: {
    type: DataTypes.VIRTUAL,
    get() {
      return {
        fullName: this.getDataValue('shippingFullName'),
        phone: this.getDataValue('shippingPhone'),
        address: this.getDataValue('shippingAddressText'),
      };
    },
    set(value) {
      this.setDataValue('shippingFullName', value.fullName);
      this.setDataValue('shippingPhone', value.phone);
      this.setDataValue('shippingAddressText', value.address);
    },
  },
}, {
  tableName: 'orders',
  indexes: [
    { fields: ['user_id', 'status', 'created_at'] },
    { fields: ['shop_id', 'status', 'created_at'] },
    { fields: ['payment_status', 'created_at'] },
  ],
});

const OrderItem = connectDB.sequelize.define('OrderItem', {
  id: idField,
  orderId: { type: DataTypes.STRING(24), allowNull: false },
  productId: { type: DataTypes.STRING(24), allowNull: false },
  productName: { type: DataTypes.STRING(150), allowNull: false },
  imageUrl: DataTypes.STRING(1000),
  unitPriceVnd: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  lineTotalVnd: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'order_items',
  indexes: [
    { fields: ['order_id'] },
    { fields: ['product_id'] },
  ],
});

Order.OrderItem = withLegacyJson(OrderItem);

module.exports = withLegacyJson(Order);
