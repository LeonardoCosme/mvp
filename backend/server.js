require('dotenv').config();
const app = require('./src/app');
const { sequelize, TipoServico } = require('./src/models');
const axios = require('axios');

const port = process.env.PORT || 8080;

(async () => {
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
      console.log(`🌱 Seeds já existentes (${count} registros). Nenhuma ação necessária.`);
    }

    app.listen(port, () => {
      console.log(`✅ API rodando na porta ${port}`);

      // 🔄 Keep-alive interno (Railway Free)
      const url = process.env.PUBLIC_URL || 'https://mvp-marido-aluguel.up.railway.app/health';
      setInterval(async () => {
        try {
          await axios.get(url);
          console.log('⏱️ Auto-ping bem-sucedido');
        } catch (err) {
          console.warn('⚠️ Falha no auto-ping:', err.message);
        }
      }, 1000 * 60 * 4); // a cada 4 minutos
    });

    // Evita encerramento automático
    process.stdin.resume();
  } catch (err) {
    console.error('⚠️ Erro ao iniciar a API:', err.message);
    process.exit(1);
  }
})();
