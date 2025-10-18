// backend/src/models/tipo_servico.js
module.exports = (sequelize, DataTypes) => {
  const TipoServico = sequelize.define(
    'TipoServico',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      nome: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
    },
    {
      tableName: 'tipos_servico',
      underscored: true, // converte automaticamente nomeServicoId -> nome_servico_id no banco
      timestamps: true,
    }
  );

  TipoServico.associate = (models) => {
    // ⚠️ mantenha o mesmo alias "tipo" usado no controller
    TipoServico.hasMany(models.Agendamento, {
      as: 'agendamentos',
      foreignKey: 'tipoServicoId', // camelCase aqui, vira tipo_servico_id no BD
    });
  };

  return TipoServico;
};
