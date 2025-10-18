const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('ServicoDisponivel', {
  prestador_id:    { type: DataTypes.INTEGER, allowNull: false },
  tipo_servico_id: { type: DataTypes.INTEGER, allowNull: false },
  descricaoServico:{ type: DataTypes.STRING(100) }
}, {
  tableName: 'servicos_disponiveis',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
