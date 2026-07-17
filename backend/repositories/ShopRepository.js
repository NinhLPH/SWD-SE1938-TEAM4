const Shop = require('../models/Shop');

const findApprovedByOwner = (ownerId) => Shop.findOne({
  owner: ownerId,
  status: 'APPROVED',
});

const findById = (id) => Shop.findById(id);

module.exports = {
  findApprovedByOwner,
  findById,
};
