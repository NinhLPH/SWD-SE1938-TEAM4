const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    orders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    }],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['COD', 'MOMO', 'VNPAY', 'MOCK'],
      required: true,
      index: true,
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    amountVnd: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'amountVnd must be an integer amount in VND',
      },
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    callbackEvents: [{
      eventId: { type: String, required: true },
      payloadHash: { type: String, required: true },
      receivedAt: { type: Date, default: Date.now },
    }],
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ transactionId: 1 }, { unique: true });
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ provider: 1, status: 1 });
paymentSchema.index({ 'callbackEvents.eventId': 1 });

module.exports = mongoose.model('Payment', paymentSchema);
