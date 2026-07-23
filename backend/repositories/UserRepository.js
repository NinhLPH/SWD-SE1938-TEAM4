const { User } = require('../models');

// Tạo người dùng mới.
const create = (data, options = {}) => User.create(data, options);

// Tìm người dùng theo email đã chuẩn hóa lowercase.
const findByEmail = (email) => User.findOne({
  where: { email: email.toLowerCase() },
});

// Tìm người dùng theo khóa chính.
const findById = (id, options = {}) => User.findByPk(id, options);

module.exports = {
  create,
  findByEmail,
  findById,
};
