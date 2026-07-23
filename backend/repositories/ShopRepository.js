const { Shop } = require('../models');

// Tìm shop đã được duyệt của một shop owner.
const findApprovedByOwner = (ownerId) => Shop.findOne({
  where: {
    ownerId,
    status: 'APPROVED',
  },
});

// Tìm shop theo id.
const findById = (id) => Shop.findByPk(id);

module.exports = {
  findApprovedByOwner,
  findById,
};
