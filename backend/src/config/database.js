require('dotenv').config();
const { Sequelize } = require('sequelize');

const isProd = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'railway',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    timezone: '-03:00',
    dialectOptions: isProd
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB conectado com sucesso');
  } catch (err) {
    console.error('❌ Erro ao conectar ao DB:', err.message);
  }
})();

module.exports = sequelize;
