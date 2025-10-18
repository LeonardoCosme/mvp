require('dotenv').config();
const app = require('./src/app');
const { sequelize, TipoServico } = require('./src/models');

const port = process.env.PORT || 3001;

// Inicia o servidor
app.listen(port, async () => {
  console.log(`✅ API V2 on :${port}`);

  try {
    // Testa a conexão com o banco
    await sequelize.authenticate();
    console.log('✅ Banco conectado com sucesso.');

    // Executa seeds automáticos se a tabela estiver vazia
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
  } catch (err) {
    console.error('⚠️ Erro ao conectar ou inserir seeds automáticos:', err.message);
  }
});
