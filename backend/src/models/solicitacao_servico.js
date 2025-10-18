const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('SolicitacaoServico', {
  id:              { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  contratante_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  tipo_servico_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  descricao:       { type: DataTypes.TEXT },
  data_sugerida:   { type: DataTypes.DATEONLY },
  hora_sugerida:   { type: DataTypes.TIME }
}, {
  tableName: 'solicitacoes_servico',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
