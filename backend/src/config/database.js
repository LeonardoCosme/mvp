require('dotenv').config();

module.exports = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'interserv_v1', // seu DB
  host:     process.env.DB_HOST || '127.0.0.1',
  port:     Number(process.env.DB_PORT || 3306),
  dialect:  'mysql',
  logging:  false,
  timezone: '-03:00',
};
