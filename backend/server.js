// ✅ Carrega variáveis de ambiente logo no início (antes de qualquer import)
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

// -------------------------------------------
// Agora os demais imports podem vir tranquilos
// -------------------------------------------

import express from "express";
import cors from "cors";
import http from "node:http";
import models from "./src/models/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Resend } from "resend";
import routes from "./src/routes/index.js";

// ✅ Verifica se DATABASE_URL foi carregada
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL não encontrada! Verifique seu arquivo .env");
  process.exit(1);
}

console.log(`🌎 Ambiente: ${process.env.NODE_ENV || "desconhecido"}`);
console.log("📁 .env carregado com sucesso");
console.log("🧩 Remetente configurado:", process.env.RESEND_FROM || "(nenhum)");
console.log("🗄️ Banco:", process.env.DATABASE_URL.split("@").pop());

// ✅ Configura Resend (envio de e-mail)
const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();

// ✅ Configuração de CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://mvp-marido-aluguel.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ Middleware de parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ Log de requisições
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    console.log(`➡️ [${req.method}] ${req.path}`);
  }
  next();
});

const { sequelize, TipoServico, Usuario } = models;

// ✅ Middleware de autenticação
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

// ✅ /api/auth/register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { nomeUsuario, email, senha, password, tipo, cpfUsuario } = req.body;
    const senhaFinal = senha || password;

    if (!nomeUsuario || !email || !senhaFinal || !tipo) {
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
      user: { id: user.id, nomeUsuario: user.nomeUsuario, email: user.email, tipo: user.tipo },
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

// ✅ /api/tipos-servico
app.get("/api/tipos-servico", async (_req, res) => {
  try {
    const tipos = await TipoServico.findAll({
      attributes: ["id", "nome"],
      order: [["id", "ASC"]],
    });
    res.json(tipos);
  } catch (err) {
    console.error("❌ Erro em /tipos-servico:", err);
    res.status(500).json({ error: "Erro ao buscar tipos de serviço." });
  }
});

// ✅ Rotas adicionais
app.use("/api", routes);

// ✅ Rotas de teste
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

startServer();
