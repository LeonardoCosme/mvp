// backend/src/models/servico_disponivel.js
module.exports = (sequelize, DataTypes) => {
  const ServicoDisponivel = sequelize.define(
    'ServicoDisponivel',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

      // FK → prestadores.id
      prestadorId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'prestador_id',
      },

      // FK → tipos_servico.id
      tipoServicoId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'tipo_servico_id',
      },

      // coluna no banco provável: descricao_servico (mapeada)
      descricaoServico: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'descricao_servico',
      },

      createdAt: { type: DataTypes.DATE, field: 'created_at' },
      updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
    },
    {
      tableName: 'servicos_disponiveis',
      timestamps: true,
      underscored: true,
    }
  );

  ServicoDisponivel.associate = (models) => {
    // Se quiser ligar:
    // ServicoDisponivel.belongsTo(models.Prestador,   { as: 'prestador',   foreignKey: 'prestadorId' });
    // ServicoDisponivel.belongsTo(models.TipoServico, { as: 'tipoServico', foreignKey: 'tipoServicoId' });
  };

  return ServicoDisponivel;
};
