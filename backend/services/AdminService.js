const bcrypt = require('bcryptjs');
const { Cart, Category, Order, Payment, Product, Shop, User } = require('../models');
const ProductRepository = require('../repositories/ProductRepository');

// Tổng hợp thống kê và dữ liệu gần đây cho dashboard admin.
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
    revenue,
  ] = await Promise.all([
    User.count(),
    Shop.count(),
    Category.count(),
    Product.count(),
    Cart.count(),
    Order.count(),
    Payment.count(),
    User.findAll({ attributes: ['id', 'fullName', 'email', 'role', 'status', 'createdAt'], order: [['createdAt', 'DESC']], limit: 10 }),
    Shop.findAll({ include: [{ model: User, as: 'owner', attributes: ['id', 'fullName', 'email'] }], order: [['createdAt', 'DESC']], limit: 10 }),
    Product.findAll({
      include: [
        { model: Shop, as: 'shop', attributes: ['id', 'name'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 12,
    }),
    Order.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName', 'email'] },
        { model: Shop, as: 'shop', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 10,
    }),
    Order.sum('totalAmountVnd', { where: { paymentStatus: 'PAID' } }),
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
      totalPaidVnd: revenue || 0,
    },
    recentUsers,
    recentShops,
    recentProducts,
    recentOrders,
  };
};

// Liệt kê người dùng, loại bỏ passwordHash khỏi kết quả.
const listUsers = () => User.findAll({
  attributes: ['id', 'fullName', 'email', 'phone', 'address', 'role', 'status', 'createdAt', 'updatedAt'],
  order: [['createdAt', 'DESC']],
});

// Lấy toàn bộ sản phẩm để admin giám sát theo shop.
const listProducts = () => ProductRepository.listAllForAdmin();

// Admin tạo tài khoản mới với mật khẩu đã mã hóa.
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

// Admin cập nhật tài khoản, chỉ đổi mật khẩu khi payload có password.
const updateUser = async (userId, payload) => {
  const update = { ...payload };
  if (payload.password) {
    update.passwordHash = await bcrypt.hash(payload.password, 10);
    delete update.password;
  }

  await User.update(update, { where: { id: userId } });
  return User.findByPk(userId, {
    attributes: { exclude: ['passwordHash'] },
  });
};

// Khóa tài khoản bằng trạng thái LOCKED.
const lockUser = async (userId) => {
  await User.update({ status: 'LOCKED' }, { where: { id: userId } });
  return User.findByPk(userId, {
    attributes: { exclude: ['passwordHash'] },
  });
};

module.exports = {
  getDashboard,
  listUsers,
  listProducts,
  createUser,
  updateUser,
  lockUser,
};
