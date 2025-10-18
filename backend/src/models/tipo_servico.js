// src/models/tipo_servico.js
module.exports = (sequelize, DataTypes) => {
  const TipoServico = sequelize.define('TipoServico', {
    // ... seus campos ...
  }, {
    tableName: 'tipos_servico',
    underscored: true,
    timestamps: true,
  });

  TipoServico.associate = (models) => {
    TipoServico.hasMany(models.Agendamento, { as: 'agendamentos', foreignKey: 'tipo_servico_id' });
  };

  return TipoServico;
};
