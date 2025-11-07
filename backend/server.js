// ✅ Imports principais
import express from 'express';
import http from 'node:http';
import next from 'next';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ✅ Importa módulos internos do backend
import models from './src/models/index.js';
import authRoutes from './src/routes/authRoutes.js';

// ✅ Configurações iniciais
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔹 Carrega variáveis de ambiente da raiz do projeto (mvp/.env)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 🔍 Log de verificação do .env
console.log('📁 Caminho .env usado:', path.resolve(__dirname, '../.env'));
console.log('🔍 DATABASE_URL (server):', process.env.DATABASE_URL);

// ✅ Inicializa o Next.js e o Express
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({
  dev,
  dir: path.resolve(__dirname, '../frontend'), // garante que o Next veja o frontend
});
const handle = nextApp.getRequestHandler();
const app = express();

app.use(express.json());

// ✅ Banco de dados
const { sequelize, TipoServico } = models;

// ✅ Função principal para inicializar o app
async function startServer() {
  try {
    // 🧠 Prepara o Next.js antes de iniciar o servidor
    await nextApp.prepare();

    // 🗄️ Conecta ao banco
    await sequelize.authenticate();
    console.log('✅ Banco conectado com sucesso.');

    await sequelize.sync();
    console.log('✅ Models sincronizados.');

    // 🌱 Seeds automáticos
    const count = await TipoServico.count();
    if (count === 0) {
      await TipoServico.bulkCreate([
        { nome: 'Elétrica básica' },
        { nome: 'Hidráulica básica' },
        { nome: 'Pintura de cômodo' },
      ]);
      console.log('🌱 Seeds automáticos inseridos no banco.');
    } else {
      console.log(`🌱 Seeds já existentes (${count} registros).`);
    }

    // ✅ Rotas do backend (antes do Next)
    app.use('/api', authRoutes);

    // 🔍 Teste simples
    app.get('/api/ping', (req, res) => res.send('✅ API ativa e respondendo!'));

    // ⚙️ Serve o build do Next.js (frontend)
    app.use(express.static(path.join(__dirname, '../frontend/.next')));

    // ⚠️ Deixa o Next.js cuidar das rotas do frontend
    app.all('*', (req, res) => handle(req, res));

    // ✅ Inicia o servidor
    const port = process.env.PORT || 3000;
    const server = http.createServer(app);

    server.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando em http://localhost:${port}`);
    });

    // ✅ Finalização segura
    process.on('SIGTERM', () => {
      console.log('⚠️ Encerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor encerrado com segurança.');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// 🚀 Inicializa tudo
startServer();
