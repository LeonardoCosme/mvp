import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Resend } from "resend";
import models from "../models/index.js";

const { Usuario } = models;
const resend = new Resend(process.env.RESEND_API_KEY);

// 🔐 LOGIN
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
      nomeUsuario: user.nome,
      tipo: user.tipo,
    });
  } catch (error) {
    console.error("❌ Erro no login:", error);
    res.status(500).json({ message: "Erro interno ao realizar login." });
  }
}

// 🧾 CADASTRO
export async function register(req, res) {
  try {
    const { nome, email, cpf, senha, tipo } = req.body;

    if (!nome || !email || !senha || !tipo) {
      return res.status(400).json({ message: "Preencha todos os campos obrigatórios." });
    }

    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ message: "E-mail já cadastrado." });
    }

    // ✅ Corrigido: bcrypt.hash agora sempre recebe uma string
    const hashSenha = await bcrypt.hash(String(senha), 10);

    const novoUsuario = await Usuario.create({
      nome,
      email,
      cpf,
      senha: hashSenha,
      tipo,
    });

    // ✅ Envia e-mail de boas-vindas
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: "Marido de Aluguel <no-reply@maridodealuguel.app.br>",
          to: email,
          subject: "Cadastro realizado com sucesso!",
          html: `
            <h2>Olá, ${nome}!</h2>
            <p>Seu cadastro foi realizado com sucesso no portal <b>Marido de Aluguel</b>.</p>
            <p>Agora você pode fazer login e utilizar todos os nossos serviços.</p>
            <p>💡 <a href="${process.env.FRONTEND_URL || "https://mvp-marido-aluguel.vercel.app"}/login">Acesse sua conta</a></p>
          `,
        });
        console.log(`📧 E-mail de boas-vindas enviado para ${email}`);
      } catch (err) {
        console.warn("⚠️ Erro ao enviar e-mail de boas-vindas:", err.message);
      }
    }

    res.status(201).json({ message: "Usuário cadastrado com sucesso!", user: novoUsuario });
  } catch (error) {
    console.error("❌ Erro em /register:", error);
    res.status(500).json({ message: "Erro ao cadastrar usuário.", detail: error.message });
  }
}

// 🔑 ESQUECI MINHA SENHA
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "E-mail é obrigatório." });
    }

    const user = await Usuario.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "segredo123",
      { expiresIn: "1h" }
    );

    const frontendUrl = process.env.FRONTEND_URL || "https://mvp-marido-aluguel.vercel.app";
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    console.log(`🔗 Link de redefinição para ${email}: ${resetLink}`);

    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: "Marido de Aluguel <no-reply@maridodealuguel.app.br>",
          to: email,
          subject: "Redefinição de senha",
          html: `
            <h2>Olá!</h2>
            <p>Você solicitou a redefinição de senha para sua conta.</p>
            <p>Clique abaixo para redefinir sua senha:</p>
            <a href="${resetLink}" style="background:#8F1D14;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;">Redefinir Senha</a>
            <p>Se você não solicitou essa alteração, ignore este e-mail.</p>
          `,
        });
        console.log(`✅ E-mail de recuperação enviado para ${email}`);
      } catch (err) {
        console.error("❌ Erro ao enviar e-mail com Resend:", err.message);
        return res.status(500).json({ message: "Falha ao enviar e-mail de recuperação." });
      }
    }

    res.json({ message: "Instruções de recuperação enviadas por e-mail." });
  } catch (error) {
    console.error("❌ Erro ao enviar recuperação de senha:", error);
    res.status(500).json({ message: "Erro ao enviar recuperação de senha." });
  }
}
