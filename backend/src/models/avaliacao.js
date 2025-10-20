// backend/src/models/avaliacao.js
module.exports = (sequelize, DataTypes) => {
  const Avaliacao = sequelize.define('Avaliacao', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    agendamentoId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'agendamento_id',
    },
    clienteId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'cliente_id',
    },
    prestadorId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'prestador_id',
    },

    nota: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5, isInt: true },
    },
    comentario: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  }, {
    tableName: 'avaliacoes',
    timestamps: true,
    underscored: true,
  });

  Avaliacao.associate = (models) => {
    Avaliacao.belongsTo(models.Agendamento, { foreignKey: 'agendamentoId', as: 'agendamento' });
    Avaliacao.belongsTo(models.Contratante, { foreignKey: 'clienteId',     as: 'cliente' });
    Avaliacao.belongsTo(models.Prestador,   { foreignKey: 'prestadorId',   as: 'prestador' });
  };

  return Avaliacao;
};
