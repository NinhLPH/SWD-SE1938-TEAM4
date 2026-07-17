const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    origin: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    priceVnd: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'priceVnd must be an integer amount in VND',
      },
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'stockQuantity must be an integer',
      },
      index: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'HIDDEN', 'SUSPENDED', 'DELETED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index({ name: 'text', description: 'text', origin: 'text' });
productSchema.index({ shop: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ priceVnd: 1, status: 1 });
productSchema.index({ stockQuantity: 1, status: 1 });
productSchema.index({ averageRating: -1, status: 1 });

module.exports = mongoose.model('Product', productSchema);
