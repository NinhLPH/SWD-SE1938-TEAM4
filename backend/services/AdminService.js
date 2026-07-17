const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

const getDashboard = async () => {
  const [
    users,
    shops,
    categories,
    products,
    carts,
    orders,
    payments,
    recentUsers,
    recentShops,
    recentProducts,
    recentOrders,
  ] = await Promise.all([
    User.countDocuments(),
    Shop.countDocuments(),
    Category.countDocuments(),
    Product.countDocuments(),
    Cart.countDocuments(),
    Order.countDocuments(),
    Payment.countDocuments(),
    User.find().select('fullName email role status createdAt').sort({ createdAt: -1 }).limit(10),
    Shop.find().populate('owner', 'fullName email').sort({ createdAt: -1 }).limit(10),
    Product.find().populate('shop', 'name').populate('category', 'name').sort({ createdAt: -1 }).limit(12),
    Order.find().populate('user', 'fullName email').populate('shop', 'name').sort({ createdAt: -1 }).limit(10),
  ]);

  const [revenue] = await Order.aggregate([
    { $match: { paymentStatus: 'PAID' } },
    { $group: { _id: null, totalPaidVnd: { $sum: '$totalAmountVnd' } } },
  ]);

  return {
    stats: {
      users,
      shops,
      categories,
      products,
      carts,
      orders,
      payments,
      totalPaidVnd: revenue?.totalPaidVnd || 0,
    },
    recentUsers,
    recentShops,
    recentProducts,
    recentOrders,
  };
};

const listUsers = () => User.find()
  .select('fullName email phone address role status createdAt updatedAt')
  .sort({ createdAt: -1 });

const listProducts = () => Product.find()
  .populate('shop', 'name')
  .populate('category', 'name')
  .populate('createdBy', 'fullName email')
  .sort({ createdAt: -1 });

const createUser = async (payload) => {
  const passwordHash = await bcrypt.hash(payload.password, 10);
  return User.create({
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    address: payload.address,
    role: payload.role,
    status: payload.status || 'ACTIVE',
    passwordHash,
  });
};

const updateUser = async (userId, payload) => {
  const update = { ...payload };
  if (payload.password) {
    update.passwordHash = await bcrypt.hash(payload.password, 10);
    delete update.password;
  }

  return User.findByIdAndUpdate(userId, update, {
    returnDocument: 'after',
    runValidators: true,
  }).select('-passwordHash');
};

const lockUser = (userId) => User.findByIdAndUpdate(
  userId,
  { status: 'LOCKED' },
  { returnDocument: 'after', runValidators: true },
).select('-passwordHash');

module.exports = {
  getDashboard,
  listUsers,
  listProducts,
  createUser,
  updateUser,
  lockUser,
};
