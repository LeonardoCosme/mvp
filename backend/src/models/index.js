// ✅ Importa dependências
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';
import createTipoServico from './tipo_servico.js';

// ✅ Caminho do .env na raiz (mvp/.env)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⚙️ Sobe três níveis até a raiz
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

// 🔍 Log de verificação do caminho e da variável
console.log('📁 Caminho .env usado:', envPath);
console.log('🔍 DATABASE_URL (models):', process.env.DATABASE_URL);

// ✅ Inicializa a conexão com Sequelize
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'mysql',
  logging: false,
});

// ✅ Inicializa o modelo
const TipoServico = createTipoServico(sequelize);

// ✅ Exporta os modelos
export default {
  sequelize,
  TipoServico,
};
