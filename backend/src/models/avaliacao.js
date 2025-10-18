const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('Avaliacao', {
  id:             { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  agendamento_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // -> agendamentos.id (UNSIGNED)
  nota:           { type: DataTypes.TINYINT, allowNull: false },
  comentario:     { type: DataTypes.TEXT }
}, {
  tableName: 'avaliacoes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
