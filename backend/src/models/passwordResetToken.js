// backend/src/models/passwordResetToken.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PasswordResetToken = sequelize.define('PasswordResetToken', {
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
}, {
  tableName: 'password_reset_tokens',
  timestamps: false,
});

module.exports = PasswordResetToken;
