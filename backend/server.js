// ✅ Carrega o .env da RAIZ do projeto corretamente
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sobe duas pastas: de /backend/src → /mvp/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log('🔍 DATABASE_URL carregado com sucesso.');

// ✅ Imports principais
import express from 'express';
import next from 'next';
import http from 'node:http';
import models from './src/models/index.js';

const { sequelize, TipoServico } = models;

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: path.resolve(__dirname, '../frontend/src') });
const handle = nextApp.getRequestHandler();

const port = Number(process.env.PORT) || 3000;

try {
  await sequelize.authenticate();
  console.log('✅ Banco conectado com sucesso.');

  await sequelize.sync();
  console.log('✅ Models sincronizados.');

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

  await nextApp.prepare();
  const app = express();

  app.all('*', (req, res) => handle(req, res));

  const server = http.createServer(app);
  server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  });

  setInterval(() => {
    console.log('💤 App ativo - aguardando conexões...');
  }, 120000);

  process.on('SIGTERM', () => {
    console.log('⚠️ Encerrando servidor (SIGTERM)...');
    server.close(() => {
      console.log('✅ Servidor encerrado com segurança.');
      process.exit(0);
    });
  });

  process.stdin.resume();
} catch (err) {
  console.error('❌ Erro ao iniciar o servidor:', err.message);
  process.exit(1);
}
