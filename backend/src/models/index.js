// backend/src/models/index.js
'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Importa todos os models e inicializa com a instância correta
const Usuario            = require('./usuario')(sequelize, DataTypes);
const Prestador          = require('./prestador')(sequelize, DataTypes);
const Contratante        = require('./contratante')(sequelize, DataTypes);
const TipoServico        = require('./tipo_servico')(sequelize, DataTypes);
const Agendamento        = require('./agendamento')(sequelize, DataTypes);
const ServicoDisponivel  = require('./servico_disponivel')(sequelize, DataTypes); // ✅ corrigido
const SolicitacaoServico = require('./solicitacao_servico')(sequelize, DataTypes); // ✅ corrigido
const Avaliacao          = require('./avaliacao')(sequelize, DataTypes); // ✅ corrigido

// Agrupa todos os models
const models = {
  Usuario,
  Prestador,
  Contratante,
  TipoServico,
  Agendamento,
  ServicoDisponivel,
  SolicitacaoServico,
  Avaliacao,
};

// Executa as associações (se existirem)
Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

// Testa a conexão e sincroniza as tabelas (⚠️ opcional em produção)
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Banco conectado com sucesso.');

    // Em produção, comente esta linha se não quiser sync automático
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
