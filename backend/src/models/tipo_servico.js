module.exports = (sequelize, DataTypes) => {
  const TipoServico = sequelize.define('TipoServico', {
    id:   { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    nome: { type: DataTypes.STRING(100), allowNull: false }, // ajuste os campos que você usa
  }, {
    tableName: 'tipos_servico',
    underscored: true,
    timestamps: true,
  });

  TipoServico.associate = (models) => {
    TipoServico.hasMany(models.Agendamento, { as: 'agendamentos', foreignKey: 'tipoServicoId' });
  };

  return TipoServico;
};
