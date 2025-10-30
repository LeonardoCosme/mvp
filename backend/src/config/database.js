// src/config/database.js
require('dotenv').config();
const { Sequelize } = require('sequelize');
const mysql2 = require('mysql2');

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error('DATABASE_URL não está definida nas variáveis do ambiente.');
}

// detecta automaticamente se precisa de SSL
function needsSSL(dbUrl) {
  try {
    const host = new URL(dbUrl).hostname;
    return host.endsWith('.proxy.rlwy.net');
  } catch {
    return false;
  }
}

const sequelize = new Sequelize(url, {
  dialect: 'mysql',
  dialectModule: mysql2,
  logging: false,
  timezone: '-03:00',
  dialectOptions: needsSSL(url)
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {}, // sem SSL no mysql.railway.internal
});

module.exports = sequelize;