// ✅ Carrega o .env da raiz do projeto antes de tudo
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sobe até a raiz do projeto: /mvp/.env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Mostra se a variável foi realmente carregada
console.log('🔍 DATABASE_URL carregado com sucesso.');

import { Sequelize } from 'sequelize';
import createTipoServico from './tipo_servico.js';

// ⚙️ Ajuste automático do dialect conforme URL
// Railway normalmente usa Postgres, mas você pode trocar para MySQL se quiser.
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: process.env.DATABASE_URL.includes('mysql') ? 'mysql' : 'postgres',
  logging: false,
});

// 🧩 Inicializa o model
const TipoServico = createTipoServico(sequelize);

// ✅ Exporta tudo
export default {
  sequelize,
  TipoServico,
};
