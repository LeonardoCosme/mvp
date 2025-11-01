// backend/server.js
require('dotenv').config();
const app = require('./src/app');
const { sequelize, TipoServico } = require('./src/models');

// A Railway define automaticamente a variável PORT
const port = process.env.PORT || 8080;

(async () => {
  try {
    // 1️⃣ Conexão com o banco
    await sequelize.authenticate();
    console.log('✅ Banco conectado com sucesso.');

    // 2️⃣ Sincronização dos models
    await sequelize.sync();
    console.log('✅ Models sincronizados.');

    // 3️⃣ Inserção dos seeds iniciais (caso não existam)
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

    // 4️⃣ Inicia o servidor Express
    app.listen(port, () => {
      console.log(`✅ API V2 rodando na porta :${port}`);
    });

    // 5️⃣ Mantém o servidor ativo no Railway (keep-alive)
    if (process.env.NODE_ENV === 'production') {
      const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
      const baseUrl = `https://${process.env.RAILWAY_STATIC_URL || 'SEU_DOMINIO_RAILWAY_AQUI'}`;
      console.log(`🔄 Keep-alive ativo para ${baseUrl}/health`);

      setInterval(() => {
        fetch(`${baseUrl}/health`)
          .then(() => console.log('⏱️ Keep-alive enviado com sucesso'))
          .catch((err) => console.warn('⚠️ Falha no keep-alive:', err.message));
      }, 14 * 60 * 1000); // 14 minutos
    }
  } catch (err) {
    console.error('⚠️ Erro ao iniciar a API:', err.message);
    process.exit(1);
  }
})();
