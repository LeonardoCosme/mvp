// backend/server.js
require('dotenv').config();
const app = require('./src/app');
const { sequelize, TipoServico } = require('./src/models');

// Porta definida automaticamente pelo Railway (ou 8080 localmente)
const port = process.env.PORT || 8080;

async function startServer() {
  try {
    // 1️⃣ Conexão com o banco
    await sequelize.authenticate();
    console.log('✅ Banco conectado com sucesso.');

    // 2️⃣ Sincronização dos models
    await sequelize.sync();
    console.log('✅ Models sincronizados.');

    // 3️⃣ Seeds iniciais
    const count = await TipoServico.count();
    if (count === 0) {
      await TipoServico.bulkCreate([
        { nome: 'Elétrica básica' },
        { nome: 'Hidráulica básica' },
        { nome: 'Pintura de cômodo' },
      ]);
      console.log('🌱 Seeds automáticos inseridos no banco.');
    } else {
      console.log(`🌱 Seeds já existentes (${count} registros). Nenhuma ação necessária.`);
    }

    // 4️⃣ Inicializa o servidor Express
    const server = app.listen(port, () => {
      console.log(`✅ API rodando na porta ${port}`);
    });

    // 5️⃣ Keep-alive automático (Railway entra em modo de hibernação sem isso)
    if (process.env.NODE_ENV === 'production') {
      const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

      const baseUrl = `https://${process.env.RAILWAY_STATIC_URL || 'mvp-marido-aluguel.up.railway.app'}`;
      const healthEndpoint = `${baseUrl}/api/health`;

      console.log(`🔄 Keep-alive ativo para ${healthEndpoint}`);

      // A cada 14 minutos, o Railway recebe um “ping” para manter o app ativo
      setInterval(() => {
        fetch(healthEndpoint)
          .then((res) => {
            if (!res.ok) throw new Error(`Status ${res.status}`);
            console.log('⏱️ Keep-alive enviado com sucesso');
          })
          .catch((err) => console.warn('⚠️ Falha no keep-alive:', err.message));
      }, 14 * 60 * 1000);
    }

    // 6️⃣ Mantém processo ativo
    process.stdin.resume();

    // 7️⃣ Encerramento limpo ao receber SIGTERM
    process.on('SIGTERM', () => {
      console.log('⚠️ Encerrando servidor (SIGTERM recebido)...');
      server.close(() => {
        console.log('✅ Servidor encerrado com segurança.');
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('⚠️ Erro ao iniciar a API:', err.message);
    process.exit(1);
  }
}

// Executa a inicialização
startServer();
