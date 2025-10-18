const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('Avaliacao', {
  agendamento_id: { type: DataTypes.INTEGER, allowNull: false },
  nota:           { type: DataTypes.TINYINT, allowNull: false },
  comentario:     { type: DataTypes.TEXT }
}, {
  tableName: 'avaliacoes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
