const crypto = require('crypto');
const { DataTypes } = require('sequelize');

const idField = {
  type: DataTypes.STRING(24),
  primaryKey: true,
  defaultValue: () => crypto.randomBytes(12).toString('hex'),
};

const withLegacyJson = (model) => {
  if (!Object.getOwnPropertyDescriptor(model.prototype, '_id')) {
    Object.defineProperty(model.prototype, '_id', {
      get() {
        return this.getDataValue('id');
      },
    });
  }

  const originalToJSON = model.prototype.toJSON;
  model.prototype.toJSON = function toJSON() {
    const value = originalToJSON.call(this);
    value._id = value.id;
    return value;
  };
  return model;
};

module.exports = {
  idField,
  withLegacyJson,
};
