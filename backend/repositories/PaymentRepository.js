const { Payment } = require('../models');

const create = (data, options = {}) => Payment.create({
  orderIds: data.orders,
  userId: data.user,
  provider: data.provider,
  transactionId: data.transactionId,
  amountVnd: data.amountVnd,
  status: data.status,
  callbackEvents: data.callbackEvents || [],
}, {
  transaction: options.transaction,
});

const findByTransactionId = (transactionId) => Payment.findOne({
  where: { transactionId },
});

const findProcessedEvent = async (transactionId, eventId) => {
  const payment = await findByTransactionId(transactionId);
  if (!payment) return null;
  return (payment.callbackEvents || []).some((event) => event.eventId === eventId) ? payment : null;
};

const appendCallbackAndSetStatus = async (transactionId, event, status) => {
  const payment = await findByTransactionId(transactionId);
  if (!payment) return null;

  const callbackEvents = payment.callbackEvents || [];
  if (callbackEvents.some((item) => item.eventId === event.eventId)) {
    return null;
  }

  payment.status = status;
  payment.callbackEvents = [
    ...callbackEvents,
    {
      ...event,
      receivedAt: new Date().toISOString(),
    },
  ];
  payment.changed('callbackEvents', true);
  await payment.save();
  return payment;
};

module.exports = {
  create,
  findByTransactionId,
  findProcessedEvent,
  appendCallbackAndSetStatus,
};
