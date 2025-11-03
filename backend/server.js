const express = require('express');
const next = require('next');
require('dotenv').config({ path: './backend/.env' });

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: './frontend' });
const handle = app.getRequestHandler();

const { sequelize, TipoServico } = require('./src/models');

const port = Number(process.env.PORT) || 3000;

async function startServer() {
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
      console.log('🌱 Seeds inseridos.');
    } else {
      console.log(`🌱 Seeds já existentes (${count} registros).`);
    }

    await app.prepare();
    const server = express();

    // Suas rotas de API podem vir aqui, se quiser

    server.all('*', (req, res) => {
      return handle(req, res);
    });

    server.listen(port, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${port}`);
    });
  } catch (err) {
    console.error('❌ Erro ao iniciar o servidor:', err.message);
    process.exit(1);
  }
}

startServer();