'use strict';
module.exports = (sequelize, DataTypes) => {
  const Contratante = sequelize.define('Contratante', {
    id:         { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true, field: 'usuario_id' },
    endereco:   { type: DataTypes.STRING(255), allowNull: true, field: 'endereco' },
    telefone:   { type: DataTypes.STRING(20),  allowNull: true, field: 'telefone' },
  }, {
    tableName: 'contratantes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: false,
  });

  Contratante.associate = (models) => {
    Contratante.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
  };

  return Contratante;
};
