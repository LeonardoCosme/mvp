console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL);

import { Sequelize } from 'sequelize';
import createTipoServico from './tipo_servico.js';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

const TipoServico = createTipoServico(sequelize);

export default {
  sequelize,
  TipoServico,
};