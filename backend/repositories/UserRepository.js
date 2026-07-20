const { User } = require('../models');

const create = (data, options = {}) => User.create(data, options);

const findByEmail = (email) => User.findOne({
  where: { email: email.toLowerCase() },
});

const findById = (id, options = {}) => User.findByPk(id, options);

module.exports = {
  create,
  findByEmail,
  findById,
};
