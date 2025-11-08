import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Resend } from "resend";
import models from "../models/index.js";

const { Usuario } = models;

// 🔧 Inicializa o Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// ==================================================
// 🔐 LOGIN
// ==================================================
export async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: "E-mail e senha são obrigatórios." });
    }

    const user = await Usuario.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      return res.status(401).json({ message: "Senha incorreta." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "segredo123",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login realizado com sucesso!",
      token,
      nomeUsuario: user.nomeUsuario,
      tipo: user.tipo,
    });
  } catch (error) {
    console.error("❌ Erro no login:", error);
    res.status(500).json({ message: "Erro interno ao realizar login." });
  }
}

// ==================================================
// 🔑 ESQUECI MINHA SENHA (via Resend)
// ==================================================
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "E-mail é obrigatório." });
    }

    const user = await Usuario.findOne({ where: { email } });

    // 🔒 Sempre retorna a mesma resposta para não expor se o usuário existe
    if (!user) {
      return res.json({
        message: "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.",
      });
    }

    // 🔑 Gera token único e link de redefinição
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

    console.log(`🔗 Link de redefinição para ${email}: ${resetLink}`);

    // 📧 Envio de e-mail com o Resend
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Redefinição de senha - Marido de Aluguel",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Redefinição de Senha</h2>
          <p>Olá, ${user.nomeUsuario}!</p>
          <p>Recebemos uma solicitação para redefinir sua senha.</p>
          <p>
            Clique no link abaixo para criar uma nova senha:
            <br/>
            <a href="${resetLink}" style="color: #F89D13; font-weight: bold;">Redefinir senha</a>
          </p>
          <p>Este link é válido por 1 hora.</p>
          <br/>
          <p>Atenciosamente,<br/><strong>Equipe Marido de Aluguel 🛠️</strong></p>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Erro ao enviar e-mail com Resend:", error);
      return res.status(500).json({ message: "Falha ao enviar e-mail de redefinição." });
    }

    res.json({
      message: "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.",
    });
  } catch (error) {
    console.error("❌ Erro ao enviar recuperação de senha:", error);
    res.status(500).json({ message: "Erro ao enviar recuperação de senha." });
  }
}
