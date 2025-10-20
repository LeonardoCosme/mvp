// backend/src/models/solicitacao_servico.js
module.exports = (sequelize, DataTypes) => {
  const SolicitacaoServico = sequelize.define(
    'SolicitacaoServico',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

      // FK → contratantes.id
      contratanteId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'contratante_id',
      },

      // FK → tipos_servico.id
      tipoServicoId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'tipo_servico_id',
      },

      descricao:     { type: DataTypes.TEXT,     allowNull: true },
      dataSugerida:  { type: DataTypes.DATEONLY, allowNull: true, field: 'data_sugerida' },
      horaSugerida:  { type: DataTypes.TIME,     allowNull: true, field: 'hora_sugerida' },

      createdAt: { type: DataTypes.DATE, field: 'created_at' },
      updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
    },
    {
      tableName: 'solicitacoes_servico',
      timestamps: true,
      underscored: true,
    }
  );

  SolicitacaoServico.associate = (models) => {
    // Se quiser ligar:
    // SolicitacaoServico.belongsTo(models.Contratante, { as: 'contratante',  foreignKey: 'contratanteId' });
    // SolicitacaoServico.belongsTo(models.TipoServico, { as: 'tipoServico',  foreignKey: 'tipoServicoId' });
  };

  return SolicitacaoServico;
};
