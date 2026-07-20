const { Shop } = require('../models');

const findApprovedByOwner = (ownerId) => Shop.findOne({
  where: {
    ownerId,
    status: 'APPROVED',
  },
});

const findById = (id) => Shop.findByPk(id);

module.exports = {
  findApprovedByOwner,
  findById,
};
