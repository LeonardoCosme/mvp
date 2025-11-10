// ✅ Imports principais
import express from "express";
import cors from "cors";
import http from "node:http";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import models from "./src/models/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";

if (!isProduction) {
  dotenv.config({ path: path.resolve(__dirname, ".env") });
  console.log("🧩 Ambiente local carregado.");
} else {
  console.log("🚀 Ambiente de produção (Railway).");
}

const app = express();
app.use(express.json());

// ✅ Configuração CORS
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:3000", "https://mvp-marido-aluguel.vercel.app"],
    credentials: true,
  })
);

const { sequelize, TipoServico, Usuario } = models;

// ✅ Funções internas (antes eram controllers)
app.post("/api/register", async (req, res) => {
  try {
    const { nome, email, senha, tipo } = req.body;
    const hash = await bcrypt.hash(senha, 10);
    const user = await Usuario.create({ nome, email, senha: hash, tipo });
    res.json({ message: "Usuário cadastrado com sucesso!", user });
  } catch (err) {
    console.error("❌ Erro em /register:", err);
    res.status(500).json({ error: "Erro ao cadastrar usuário." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    const user = await Usuario.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const isValid = await bcrypt.compare(senha, user.senha);
    if (!isValid) return res.status(401).json({ error: "Senha incorreta" });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "segredo", {
      expiresIn: "1h",
    });
    res.json({ message: "Login efetuado com sucesso!", token });
  } catch (err) {
    console.error("❌ Erro em /login:", err);
    res.status(500).json({ error: "Erro ao realizar login." });
  }
});

app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Usuario.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "segredo", { expiresIn: "10m" });
    const resetLink = `https://mvp-marido-aluguel.vercel.app/reset-password?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Redefinição de senha - Marido de Aluguel",
      html: `<p>Clique no link abaixo para redefinir sua senha:</p>
             <a href="${resetLink}">${resetLink}</a>`,
    });

    res.json({ message: "E-mail de redefinição enviado com sucesso!" });
  } catch (err) {
    console.error("❌ Erro em /forgot-password:", err);
    res.status(500).json({ error: "Erro ao enviar e-mail de redefinição." });
  }
});

// ✅ Rotas de teste
app.get("/api/teste", (req, res) => res.json({ ok: true, message: "Rota /api/teste ativa!" }));
app.get("/api/ping", (req, res) => res.json({ message: "✅ API ativa e respondendo!" }));

// ✅ Inicialização
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("✅ Banco conectado com sucesso.");
    await sequelize.sync();
    console.log("✅ Models sincronizados.");

    const port = process.env.PORT || 8080;
    const server = http.createServer(app);

    server.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Servidor rodando na porta ${port}`);
      console.log("🔗 Rotas: /api/register | /api/login | /api/forgot-password | /api/teste | /api/ping");
    });
  } catch (error) {
    console.error("❌ Erro ao iniciar servidor:", error);
  }
}

startServer();
