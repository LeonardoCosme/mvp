require('dotenv').config();
const { sequelize, TipoServico } = require('../models');

(async () => {
  try {
    await sequelize.authenticate();

    await TipoServico.bulkCreate(
      [
        { nome: 'Elétrica básica' },
        { nome: 'Hidráulica básica' },
        { nome: 'Pintura de cômodo' },
      ],
      { ignoreDuplicates: true }
    );

    console.log('✅ Seeds inseridos com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao rodar seed:', err);
    process.exit(1);
  }
})();
