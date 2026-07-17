const Payment = require('../models/Payment');

const create = (data, options = {}) => Payment.create([data], {
  ...options,
  ordered: true,
}).then((items) => items[0]);

const findByTransactionId = (transactionId) => Payment.findOne({ transactionId });

const findProcessedEvent = (transactionId, eventId) => Payment.findOne({
  transactionId,
  'callbackEvents.eventId': eventId,
});

const appendCallbackAndSetStatus = (transactionId, event, status) => Payment.findOneAndUpdate(
  {
    transactionId,
    'callbackEvents.eventId': { $ne: event.eventId },
  },
  {
    $set: { status },
    $push: { callbackEvents: event },
  },
  { returnDocument: 'after' },
);

module.exports = {
  create,
  findByTransactionId,
  findProcessedEvent,
  appendCallbackAndSetStatus,
};
