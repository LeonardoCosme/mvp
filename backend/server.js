// ✅ Imports principais
import express from "express";
import cors from "cors";
import http from "node:http";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ✅ Imports locais
import models from "./src/models/index.js";
import authRoutes from "./src/routes/authRoutes.js";
import { login, register, forgotPassword } from "./src/controllers/authController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Detecta ambiente
const isProduction = process.env.NODE_ENV === "production";

// ✅ Carrega variáveis locais apenas fora do Railway
if (!isProduction) {
  const envPath = path.resolve(__dirname, ".env");
  dotenv.config({ path: envPath });
  console.log("🧩 Ambiente local: .env carregado de", envPath);
} else {
  console.log("🚀 Ambiente de produção: variáveis do Railway carregadas");
}

const app = express();

// ✅ Configuração de CORS
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:3000", "https://mvp-marido-aluguel.vercel.app"],
    credentials: true,
  })
);

app.use(express.json());

// ✅ Banco de dados
const { sequelize, TipoServico } = models;

// ✅ Rotas diretas (backup e diagnóstico)
app.post("/api/login", login);
app.post("/api/register", register);
app.post("/api/forgot-password", forgotPassword);

// ✅ Rota de teste simples
app.get("/api/teste", (req, res) => {
  console.log("✅ /api/teste acessada");
  res.json({ ok: true, message: "Rota /api/teste funcionando!" });
});

// ✅ Rotas importadas
app.use("/api", authRoutes);

// ✅ Rota ping para health check
app.get("/api/ping", (req, res) => {
  res.json({
    message: "✅ API ativa e respondendo!",
    environment: isProduction ? "production" : "development",
  });
});

// ✅ Inicialização
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("✅ Banco conectado com sucesso.");
    await sequelize.sync();
    console.log("✅ Models sincronizados.");

    const count = await TipoServico.count();
    if (count === 0) {
      await TipoServico.bulkCreate([
        { nome: "Elétrica básica" },
        { nome: "Hidráulica básica" },
        { nome: "Pintura de cômodo" },
      ]);
      console.log("🌱 Seeds criados automaticamente.");
    } else {
      console.log(`🌱 Seeds já existentes (${count} registros).`);
    }

    const port = process.env.PORT || 8080;
    const server = http.createServer(app);

    server.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Servidor rodando em http://localhost:${port}`);
      console.log(`🔗 CORS liberado para: ${FRONTEND_URL}`);
      console.log(isProduction ? "🌐 Ambiente: Produção (Railway)" : "🧩 Ambiente: Desenvolvimento local");
    });

    process.on("SIGTERM", () => {
      console.log("⚠️ Encerrando servidor...");
      server.close(() => {
        console.log("✅ Servidor encerrado com segurança.");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Erro ao iniciar servidor:", error);
    process.exit(1);
  }
}

startServer();
