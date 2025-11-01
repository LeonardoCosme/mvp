require('dotenv').config();
const app = require('./src/app');
const { sequelize, TipoServico } = require('./src/models');

const port = process.env.PORT || 8080;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Banco conectado com sucesso.');

    await sequelize.sync();

    // Seeds (iguais aos seus)
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
      console.log(`✅ API V2 on :${port}`);
    });
  } catch (err) {
    console.error('⚠️ Erro ao iniciar a API:', err.message);
    process.exit(1);
  }
})();