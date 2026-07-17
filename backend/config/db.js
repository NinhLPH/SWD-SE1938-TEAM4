const mongoose = require('mongoose');

const connectDB = async (mongoUri = process.env.MONGODB_URI) => {
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri);
  return mongoose.connection;
};

module.exports = connectDB;
