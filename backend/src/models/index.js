// src/models/index.js
'use strict';
const { Sequelize, DataTypes } = require('sequelize');

let config = require('../config/database');
if (config.development || config.production || config.test) {
  const env = process.env.NODE_ENV || 'development';
  config = config[env];
}

const sequelize = new Sequelize(
  config.database, config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging ?? false,
    timezone: config.timezone || '-03:00',
  }
);

const db = {};
db.Usuario     = require('./usuario')(sequelize, DataTypes);
db.Prestador   = require('./prestador')(sequelize, DataTypes);
db.Contratante = require('./contratante')(sequelize, DataTypes);
db.TipoServico = require('./tipo_servico')(sequelize, DataTypes);
db.Agendamento = require('./agendamento')(sequelize, DataTypes);

// chama associate se existir (sem duplicar aliases)
Object.values(db).forEach(m => typeof m?.associate === 'function' && m.associate(db));

db.sequelize = sequelize;
db.Sequelize = Sequelize;
module.exports = db;
