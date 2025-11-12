// src/models/PasswordResetToken.js
export default (sequelize, DataTypes) => {
  const PasswordResetToken = sequelize.define(
    "PasswordResetToken",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: "userId",
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "expiresAt",
      },
    },
    {
      tableName: "password_reset_tokens",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  // 🔗 Associação com o modelo Usuario
  PasswordResetToken.associate = (models) => {
    PasswordResetToken.belongsTo(models.Usuario, {
      foreignKey: "userId",
      targetKey: "id",
      as: "usuario",
      onDelete: "CASCADE",
    });
  };

  return PasswordResetToken;
};
