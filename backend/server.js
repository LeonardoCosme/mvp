// backend/server.js
require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { sequelize, TipoServico } = require('./src/models');

const port = Number(process.env.PORT) || 8080;

async function startServer() {
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

    // 4️⃣ Cria servidor HTTP manualmente
    const server = http.createServer(app);

    server.listen(port, '0.0.0.0', () => {
      console.log(`✅ Servidor ativo e ouvindo na porta ${port}`);
    });

    // 5️⃣ Log de heartbeat para manter o processo ativo
    setInterval(() => {
      console.log('💤 App ativo - aguardando conexões...');
    }, 120000);

    // 6️⃣ Captura encerramento
    process.on('SIGTERM', () => {
      console.log('⚠️ Encerrando servidor (SIGTERM)...');
      server.close(() => {
        console.log('✅ Servidor encerrado com segurança.');
        process.exit(0);
      });
    });

    // 7️⃣ Garante que o processo não morra
    process.stdin.resume();

  } catch (err) {
    console.error('❌ Erro ao iniciar o servidor:', err.message);
    process.exit(1);
  }
}

startServer();
