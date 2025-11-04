import 'dotenv/config';
import express from 'express';
import next from 'next';
import http from 'node:http';

// ✅ Corrigido: importa o objeto default e extrai os modelos
import models from './backend/src/models/index.js';

const { sequelize, TipoServico } = models;

const dev = process.env.NODE_ENV !== 'production';
// ✅ Corrigido: aponta para o diretório correto onde está a pasta `app`
const nextApp = next({ dev, dir: '../frontend/src' });
const handle = nextApp.getRequestHandler();

const port = Number(process.env.PORT) || 3000;

try {
  // 1️⃣ Conecta ao banco
  await sequelize.authenticate();
  console.log('✅ Banco conectado com sucesso.');

  // 2️⃣ Sincroniza models
  await sequelize.sync();
  console.log('✅ Models sincronizados.');

  // 3️⃣ Seeds automáticos
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

  // 4️⃣ Prepara o Next.js
  await nextApp.prepare();
  const app = express();

  // 5️⃣ Rotas Express (se tiver APIs, coloque aqui)

  // 6️⃣ Roteamento Next.js
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  // 7️⃣ Cria servidor HTTP
  const server = http.createServer(app);
  server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  });

  // 8️⃣ Heartbeat
  setInterval(() => {
    console.log('💤 App ativo - aguardando conexões...');
  }, 120000);

  // 9️⃣ Encerramento seguro
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