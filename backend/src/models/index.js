'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 🔹 Importa todos os models
const Usuario = require('./usuario')(sequelize, DataTypes);
const Prestador = require('./prestador')(sequelize, DataTypes);
const Contratante = require('./contratante')(sequelize, DataTypes);
const TipoServico = require('./tipo_servico')(sequelize, DataTypes);
const Agendamento = require('./agendamento')(sequelize, DataTypes);
const ServicoDisponivel = require('./servico_disponivel')(sequelize, DataTypes);
const SolicitacaoServico = require('./solicitacao_servico')(sequelize, DataTypes);
const Avaliacao = require('./avaliacao')(sequelize, DataTypes);

// 🔹 Novos models para redefinição e verificação de e-mail
const PasswordResetToken = require('./passwordResetToken')(sequelize, DataTypes);
const EmailVerificationToken = require('./EmailVerificationToken')(sequelize, DataTypes);

// 🔹 Agrupa todos os models
const models = {
  Usuario,
  Prestador,
  Contratante,
  TipoServico,
  Agendamento,
  ServicoDisponivel,
  SolicitacaoServico,
  Avaliacao,
  PasswordResetToken,
  EmailVerificationToken,
};

// 🔹 Executa as associações, se existirem
Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

// 🔹 Testa a conexão e sincroniza as tabelas (opcional em produção)
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Banco conectado com sucesso.');

    // ⚠️ Em produção, comente se não quiser sincronização automática
    await sequelize.sync();
    console.log('✅ Models sincronizados.');
  } catch (err) {
    console.error('❌ Erro ao conectar ou sincronizar o banco:', err.message);
  }
})();

module.exports = {
  ...models,
  sequelize,
};
