// src/models/Avaliacao.js
module.exports = (sequelize, DataTypes) => {
  const Avaliacao = sequelize.define('Avaliacao', {
    nota: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    comentario: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'avaliacoes',
    underscored: true,
  });

  Avaliacao.associate = (models) => {
    Avaliacao.belongsTo(models.Agendamento, { foreignKey: 'agendamentoId', as: 'agendamento' });
    Avaliacao.belongsTo(models.Contratante, { foreignKey: 'clienteId', as: 'cliente' });
    Avaliacao.belongsTo(models.Prestador,   { foreignKey: 'prestadorId', as: 'prestador' });
  };

  return Avaliacao;
};
