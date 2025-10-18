require('dotenv').config();
const { Sequelize } = require('sequelize');

const isProd = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
  process.env.DB_NAME || process.env.MYSQLDATABASE || 'railway',
  process.env.DB_USER || process.env.MYSQLUSER || 'root',
  process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  {
    host: process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
    dialect: 'mysql', // 👈 aqui o Sequelize entende que é MySQL
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
    console.log('✅ DB conectado com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao conectar ao DB:', err.message);
  }
})();

module.exports = sequelize;
