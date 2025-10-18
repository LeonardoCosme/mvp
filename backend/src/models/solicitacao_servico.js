const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('SolicitacaoServico', {
  contratante_id:  { type: DataTypes.INTEGER, allowNull: false },
  tipo_servico_id: { type: DataTypes.INTEGER, allowNull: false },
  descricao:       { type: DataTypes.TEXT },
  data_sugerida:   { type: DataTypes.DATEONLY },
  hora_sugerida:   { type: DataTypes.TIME }
}, {
  tableName: 'solicitacoes_servico',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
