// backend/src/models/EmailVerificationToken.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const EmailVerificationToken = sequelize.define(
    'EmailVerificationToken',
    {
      token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'email_verification_tokens',
      timestamps: true,
      underscored: true,
    }
  );

  EmailVerificationToken.associate = (models) => {
    EmailVerificationToken.belongsTo(models.Usuario, {
      foreignKey: 'userId',
      as: 'usuario',
      onDelete: 'CASCADE',
    });
  };

  return EmailVerificationToken;
};
