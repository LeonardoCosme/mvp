// src/models/agendamento.js
module.exports = (sequelize, DataTypes) => {
  const Agendamento = sequelize.define(
    'Agendamento',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

      // FKs
      contratanteId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'contratante_id' }, // -> usuarios.id
      prestadorId:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: true,  field: 'prestador_id' },   // -> prestadores.id
      tipoServicoId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'tipo_servico_id' },// -> tipos_servico.id

      // Campos
      descricao:     { type: DataTypes.TEXT, allowNull: true },
      dataServico:   { type: DataTypes.DATEONLY, allowNull: false, field: 'data_servico' }, // YYYY-MM-DD
      horaServico:   { type: DataTypes.TIME,     allowNull: false, field: 'hora_servico' }, // HH:MM:SS
      duracaoHoras:  { type: DataTypes.DECIMAL(4, 2), allowNull: true, field: 'duracao_horas' },

      endereco:      { type: DataTypes.STRING(255), allowNull: true },

      status: {
        type: DataTypes.ENUM('pendente', 'aceita', 'concluida', 'cancelada'),
        allowNull: false,
        defaultValue: 'pendente',
      },

      createdAt:     { type: DataTypes.DATE, field: 'created_at' },
      updatedAt:     { type: DataTypes.DATE, field: 'updated_at' },
    },
    {
      tableName: 'agendamentos',
      timestamps: true,
      underscored: true, // apenas timestamps/auto
    }
  );

  Agendamento.associate = (models) => {
    // contratante_id → usuarios.id
    Agendamento.belongsTo(models.Usuario,   { as: 'contratante', foreignKey: 'contratanteId' });
    // prestador_id → prestadores.id  ✅ (corrigido)
    Agendamento.belongsTo(models.Prestador, { as: 'prestador',   foreignKey: 'prestadorId' });
    // tipo_servico_id → tipos_servico.id
    Agendamento.belongsTo(models.TipoServico, { as: 'tipo', foreignKey: 'tipoServicoId' });
  };

  return Agendamento;
};
