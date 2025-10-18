// src/models/prestador.js
'use strict';
module.exports = (sequelize, DataTypes) => {
  const Prestador = sequelize.define('Prestador', {
    usuario_id:    { type: DataTypes.INTEGER, allowNull: false, unique: true, field: 'usuario_id' },
    cnpjPrestador: { type: DataTypes.STRING(18), allowNull: true,  field: 'cnpjPrestador' },
    celPrestador:  { type: DataTypes.STRING(20), allowNull: true,  field: 'celPrestador' },
  }, {
    tableName: 'prestadores',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: false,
  });

  Prestador.associate = (models) => {
    Prestador.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    // inverso (opcional)
    Prestador.hasMany(models.Agendamento, { as: 'agendamentos', foreignKey: 'prestadorId' });
  };

  return Prestador;
};
