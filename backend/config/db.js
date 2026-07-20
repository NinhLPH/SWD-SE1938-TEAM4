const { Sequelize } = require('sequelize');

const isTest = process.env.NODE_ENV === 'test';
const database = process.env.SQLSERVER_DATABASE || 'fruit_marketplace';
const username = process.env.SQLSERVER_USER || 'sa';
const password = process.env.SQLSERVER_PASSWORD || '1';
const host = process.env.SQLSERVER_HOST || '127.0.0.1';
const port = Number(process.env.SQLSERVER_PORT || 1433);

const sequelize = new Sequelize(isTest ? 'sqlite::memory:' : database, username, password, {
  host: isTest ? undefined : host,
  port: isTest ? undefined : port,
  dialect: isTest ? 'sqlite' : 'mssql',
  logging: process.env.SQL_LOGGING === 'true' ? console.log : false,
  dialectOptions: isTest ? undefined : {
    options: {
      encrypt: process.env.SQLSERVER_ENCRYPT === 'true',
      trustServerCertificate: process.env.SQLSERVER_TRUST_CERT !== 'false',
    },
  },
  define: {
    timestamps: true,
    underscored: true,
  },
});

const ensureSqlServerDatabase = async () => {
  if (isTest) return;

  const bootstrap = new Sequelize('master', username, password, {
    host,
    port,
    dialect: 'mssql',
    logging: false,
    dialectOptions: {
      options: {
        encrypt: process.env.SQLSERVER_ENCRYPT === 'true',
        trustServerCertificate: process.env.SQLSERVER_TRUST_CERT !== 'false',
      },
    },
  });

  try {
    await bootstrap.query(`IF DB_ID(N'${database.replace(/'/g, "''")}') IS NULL CREATE DATABASE [${database.replace(/]/g, ']]')}]`);
  } finally {
    await bootstrap.close();
  }
};

const connectDB = async () => {
  require('../models');
  await ensureSqlServerDatabase();
  await sequelize.authenticate();
  await sequelize.sync({ alter: process.env.DB_SYNC_ALTER === 'true' });
  return sequelize;
};

connectDB.sequelize = sequelize;

module.exports = connectDB;
