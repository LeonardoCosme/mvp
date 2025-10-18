'use strict';
module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define('Usuario', {
    id:          { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    nomeUsuario: { type: DataTypes.STRING(100), allowNull: false, field: 'nomeUsuario' },
    cpfUsuario:  { type: DataTypes.STRING(14),  allowNull: true,  field: 'cpfUsuario' },
    email:       { type: DataTypes.STRING(100), allowNull: false, unique: true, field: 'email' },
    senha:       { type: DataTypes.STRING(255), allowNull: false, field: 'senha' },
    tipo:        { type: DataTypes.ENUM('master','prestador','contratante'), allowNull: false, field: 'tipo' },
  }, {
    tableName: 'usuarios',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: false,
  });

  Usuario.associate = (models) => {
    Usuario.hasOne(models.Prestador,   { foreignKey: 'usuario_id', as: 'prestador' });
    Usuario.hasOne(models.Contratante, { foreignKey: 'usuario_id', as: 'contratante' });
  };

  return Usuario;
};
