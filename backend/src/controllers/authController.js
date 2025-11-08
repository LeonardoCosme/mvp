import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import models from "../models/index.js"; // importa todos os models

const { Usuario } = models; // garante que o model Usuario está acessível

// 🔐 LOGIN
export async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: "E-mail e senha são obrigatórios." });
    }

    const user = await Usuario.findOne({ where: { email } }); // 👈 aqui dava erro antes

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
    console.error("Erro no login:", error);
    res.status(500).json({ message: "Erro interno ao realizar login." });
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

    // aqui você pode gerar token e enviar por e-mail
    res.json({ message: "Instruções de recuperação enviadas por e-mail." });
  } catch (error) {
    console.error("Erro ao enviar recuperação de senha:", error);
    res.status(500).json({ message: "Erro ao enviar recuperação de senha." });
  }
}
