// backend/src/controllers/password_controller.js
const { Usuario, PasswordResetToken } = require('../models');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendStyledEmail } = require('../services/emailService');
const { Op } = require('sequelize');

/* 🔹 Envia e-mail com link de redefinição */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await Usuario.findOne({ where: { email } });

    if (!user) {
      console.log(`⚠️ Solicitação de redefinição para e-mail não cadastrado: ${email}`);
      return res.json({ message: 'Se o e-mail estiver cadastrado, um link foi enviado.' });
    }

    // Remove tokens antigos do mesmo usuário
    await PasswordResetToken.destroy({ where: { userId: user.id } });

    // Gera token e salva no banco
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
    await PasswordResetToken.create({ token, userId: user.id, expiresAt });

    // Link com redirecionamento para o frontend
    const link = `http://localhost:3000/reset-password?token=${token}`;

    // Envia e-mail estilizado com botão
    await sendStyledEmail(user.email, 'Redefinição de senha - Marido de Aluguel', {
      title: 'Redefinição de senha',
      message: `
        Olá, <strong>${user.nomeUsuario}</strong>!<br><br>
        Recebemos uma solicitação para redefinir sua senha.<br>
        Clique no botão abaixo para criar uma nova senha (válido por 15 minutos):`,
      buttonText: 'Redefinir senha',
      buttonLink: link,
    });

    console.log(`📩 E-mail de redefinição enviado para ${user.email}`);
    return res.json({ message: 'E-mail de redefinição enviado com sucesso!' });
  } catch (err) {
    console.error('❌ Erro em forgotPassword:', err);
    return res.status(500).json({ error: 'Erro ao enviar o e-mail de redefinição.' });
  }
}

/* 🔹 Redefine a senha e envia e-mail de confirmação */
async function resetPassword(req, res) {
  try {
    console.log('🧩 Corpo recebido em /reset-password:', req.body);
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
    }

    // Busca o token válido e não expirado
    const tokenData = await PasswordResetToken.findOne({
      where: {
        token,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!tokenData) {
      return res.status(400).json({ error: 'Token inválido ou expirado.' });
    }

    // Atualiza senha
    const user = await Usuario.findByPk(tokenData.userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const hashed = await bcrypt.hash(novaSenha, 10);
    await user.update({ password: hashed });

    // Exclui token após uso
    await PasswordResetToken.destroy({ where: { token } });

    // Envia e-mail de confirmação estilizado
    await sendStyledEmail(user.email, 'Senha redefinida com sucesso - Marido de Aluguel', {
      title: 'Senha alterada com sucesso!',
      message: `
        Olá, <strong>${user.nomeUsuario}</strong>!<br><br>
        Sua senha foi redefinida com sucesso.<br>
        Caso você não tenha realizado essa ação, entre em contato imediatamente com o suporte.`,
      buttonText: 'Acessar conta',
      buttonLink: 'http://localhost:3000/login',
    });

    console.log(`✅ Senha redefinida e e-mail de confirmação enviado para ${user.email}`);
    return res.json({ message: 'Senha redefinida com sucesso e e-mail de confirmação enviado!' });
  } catch (err) {
    console.error('❌ Erro em resetPassword:', err);
    return res.status(500).json({ error: 'Erro ao redefinir senha.' });
  }
}

/* 🔹 Limpa tokens expirados periodicamente */
async function limparTokensExpirados() {
  try {
    const deletados = await PasswordResetToken.destroy({
      where: { expiresAt: { [Op.lt]: new Date() } },
    });
    if (deletados > 0) console.log(`🧹 Tokens expirados removidos: ${deletados}`);
  } catch (err) {
    console.error('Erro ao limpar tokens expirados:', err);
  }
}

module.exports = { forgotPassword, resetPassword, limparTokensExpirados };
