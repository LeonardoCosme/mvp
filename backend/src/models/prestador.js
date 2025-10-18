'use strict';
module.exports = (sequelize, DataTypes) => {
  const Prestador = sequelize.define('Prestador', {
    id:           { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    usuario_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true, field: 'usuario_id' },
    cnpjPrestador:{ type: DataTypes.STRING(18), allowNull: true,  field: 'cnpjPrestador' },
    celPrestador: { type: DataTypes.STRING(20), allowNull: true,  field: 'celPrestador' },
  }, {
    tableName: 'prestadores',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: false,
  });

  Prestador.associate = (models) => {
    Prestador.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    Prestador.hasMany(models.Agendamento, { as: 'agendamentos', foreignKey: 'prestadorId' });
  };

  return Prestador;
};
