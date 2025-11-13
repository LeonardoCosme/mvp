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
import { Resend } from "resend";
import routes from "./src/routes/index.js"; // 👈 Importa rotas antigas

// ✅ Configura Resend (envio de e-mail)
const resend = new Resend(process.env.RESEND_API_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  dotenv.config({ path: path.resolve(__dirname, ".env") });
  console.log("🧩 Ambiente local carregado.");
} else {
  console.log("🚀 Ambiente de produção (Railway).");
}

console.log("🧩 Remetente configurado:", process.env.RESEND_FROM);

const app = express();

// ✅ Middleware de parsing reforçado
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ Log de diagnóstico para debug de registro
app.use((req, res, next) => {
  if (req.path.includes("/api/auth/register")) {
    console.log("📦 [LOG] Body recebido em /api/auth/register:", req.body);
  }
  next();
});

// ✅ Configuração CORS
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
app.use(
  cors({
    origin: [
      FRONTEND_URL,
      "http://localhost:3000",
      "https://mvp-marido-aluguel.vercel.app",
      "https://mvp-marido-aluguel.vercel.app/",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

const { sequelize, TipoServico, Usuario } = models;

// ✅ Middleware JWT
function autenticarToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token não fornecido." });

  jwt.verify(token, process.env.JWT_SECRET || "segredo", (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido ou expirado." });
    req.user = user;
    next();
  });
}

// ✅ /api/auth/register — aceita senha OU password
app.post("/api/auth/register", async (req, res) => {
  try {
    const { nomeUsuario, email, senha, password, tipo, cpfUsuario } = req.body;
    const senhaFinal = senha || password; // ✅ aceita ambos

    if (!nomeUsuario || !email || !senhaFinal || !tipo) {
      console.log("⚠️ Campos recebidos incompletos:", req.body);
      return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    }

    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ error: "E-mail já cadastrado." });
    }

    const hash = await bcrypt.hash(senhaFinal, 10);
    const user = await Usuario.create({
      nomeUsuario,
      email,
      senha: hash,
      tipo,
      cpfUsuario,
    });

    res.json({
      message: "Usuário cadastrado com sucesso!",
      user: {
        id: user.id,
        nomeUsuario: user.nomeUsuario,
        email: user.email,
        tipo: user.tipo,
      },
    });
  } catch (err) {
    console.error("❌ Erro em /auth/register:", err);
    res.status(500).json({ error: "Erro ao cadastrar usuário." });
  }
});

// ✅ /api/login
app.post("/api/login", async (req, res) => {
  try {
    const { email, senha, password } = req.body;
    const senhaLogin = senha || password;

    const user = await Usuario.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    const isValid = await bcrypt.compare(senhaLogin, user.senha);
    if (!isValid) return res.status(401).json({ error: "Senha incorreta." });

    const token = jwt.sign(
      { id: user.id, email: user.email, tipo: user.tipo },
      process.env.JWT_SECRET || "segredo",
      { expiresIn: "1h" }
    );
    res.json({ message: "Login efetuado com sucesso!", token });
  } catch (err) {
    console.error("❌ Erro em /login:", err);
    res.status(500).json({ error: "Erro ao realizar login." });
  }
});

// ✅ /api/user/me
app.get("/api/user/me", autenticarToken, async (req, res) => {
  try {
    const user = await Usuario.findByPk(req.user.id, {
      attributes: ["id", "nomeUsuario", "cpfUsuario", "email", "tipo", "created_at"],
    });

    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });
    res.json(user);
  } catch (err) {
    console.error("❌ Erro em /user/me:", err);
    res.status(500).json({ error: "Erro ao buscar usuário." });
  }
});

// ✅ /api/user/forgot-password
app.post("/api/user/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Usuario.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "segredo", {
      expiresIn: "10m",
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Marido de Aluguel <no-reply@maridodealuguel.app.br>",
      to: email,
      subject: "Redefinição de senha - Marido de Aluguel",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Olá, ${user.nomeUsuario}</h2>
          <p>Você solicitou redefinição de senha. Clique no link abaixo para continuar:</p>
          <p><a href="${resetLink}" target="_blank" style="color: #F89D13; font-weight: bold;">Redefinir minha senha</a></p>
          <p><small>O link expira em 10 minutos.</small></p>
          <hr>
          <p>Se você não solicitou essa alteração, ignore este e-mail.</p>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Erro ao enviar e-mail via Resend:", error);
      return res.status(500).json({ error: "Falha no envio de e-mail." });
    }

    res.json({ message: "E-mail de redefinição enviado com sucesso!" });
  } catch (err) {
    console.error("❌ Erro em /user/forgot-password:", err);
    res.status(500).json({ error: "Erro ao enviar e-mail de redefinição." });
  }
});

// ✅ /api/tipos-servico
app.get("/api/tipos-servico", async (req, res) => {
  try {
    if (TipoServico) {
      const tipos = await TipoServico.findAll();
      return res.json(tipos);
    }
    res.json([
      { id: 1, nome: "Elétrica" },
      { id: 2, nome: "Hidráulica" },
      { id: 3, nome: "Pintura" },
      { id: 4, nome: "Montagem de móveis" },
    ]);
  } catch (err) {
    console.error("❌ Erro em /tipos-servico:", err);
    res.status(500).json({ error: "Erro ao buscar tipos de serviço." });
  }
});

// ✅ Rotas adicionais
app.use("/api", routes);
app.get("/api/teste", (_req, res) => res.json({ ok: true, message: "Rota /api/teste ativa!" }));
app.get("/api/health", (_req, res) => res.json({ ok: true, message: "✅ API rodando com sucesso 🚀" }));

// ✅ Inicialização
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("✅ Banco conectado com sucesso.");
    await sequelize.sync();
    console.log("✅ Models sincronizados.");

    const port = Number(process.env.PORT) || 5000;
    const host = "0.0.0.0";

    const server = http.createServer(app);
    server.listen(port, host, () => {
      console.log(`🚀 Servidor rodando em http://${host}:${port}`);
      console.log("🔗 Rotas completas disponíveis em /api/*");
    });

    server.on("error", (err) => {
      console.error("❌ Erro no servidor HTTP:", err);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Erro ao iniciar servidor:", error);
    process.exit(1);
  }
}

// 🚀 Inicia servidor
startServer();
