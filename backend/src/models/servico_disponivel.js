const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('ServicoDisponivel', {
  id:              { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  prestador_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },  // -> prestadores.id (UNSIGNED)
  tipo_servico_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },  // -> tipos_servico.id (UNSIGNED)
  descricaoServico:{ type: DataTypes.STRING(100) }
}, {
  tableName: 'servicos_disponiveis',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
