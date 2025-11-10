// ✅ Imports principais
import express from "express";
import cors from "cors";
import http from "node:http";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import models from "./src/models/index.js";
import authRoutes from "./src/routes/authRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Detecta ambiente
const isProduction = process.env.NODE_ENV === "production";

// ✅ Carrega .env local (Railway já injeta as variáveis em produção)
if (!isProduction) {
  const envPath = path.resolve(__dirname, ".env");
  dotenv.config({ path: envPath });
  console.log("🧩 Ambiente local: .env carregado de", envPath);
} else {
  console.log("🚀 Ambiente de produção: variáveis do Railway carregadas");
}

console.log("📁 Caminho .env usado:", path.resolve(__dirname, ".env"));
console.log("🔍 DATABASE_URL (server):", process.env.DATABASE_URL);

const app = express();

// ✅ Configuração de CORS — libera local + produção (Vercel)
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:3000",
  "https://mvp-marido-aluguel.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Postman, etc.
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn("🚫 Bloqueado por CORS:", origin);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// ✅ Banco de dados
const { sequelize, TipoServico } = models;

// ✅ Inicialização
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("✅ Banco conectado com sucesso.");

    await sequelize.sync();
    console.log("✅ Models sincronizados.");

    // 🌱 Seeds automáticos
    const count = await TipoServico.count();
    if (count === 0) {
      await TipoServico.bulkCreate([
        { nome: "Elétrica básica" },
        { nome: "Hidráulica básica" },
        { nome: "Pintura de cômodo" },
      ]);
      console.log("🌱 Seeds automáticos inseridos no banco.");
    } else {
      console.log(`🌱 Seeds já existentes (${count} registros).`);
    }


    //teste de rota
    app.get("/api/teste", (req, res) => {
  res.json({ ok: true, message: "Rota teste funcionando!" });
});
    // ✅ Rotas principais
    app.use("/api", authRoutes);

    // 🔍 Teste rápido (GET /api/ping)
    app.get("/api/ping", (req, res) => {
      res.json({
        message: "✅ API ativa e respondendo!",
        frontend: FRONTEND_URL,
        environment: isProduction ? "production" : "development",
      });
    });

    // ✅ Captura rotas inexistentes (evita "Cannot GET /api/register")
    app.use((req, res, next) => {
      if (req.path.startsWith("/api")) {
        return res
          .status(404)
          .json({ error: `Rota não encontrada: ${req.method} ${req.path}` });
      }
      next();
    });

    // 🚀 Inicia servidor
    const port = process.env.PORT || 5000;
    const server = http.createServer(app);

    server.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Backend rodando em http://localhost:${port}`);
      console.log(
        isProduction
          ? "🌐 Ambiente: Produção (Railway)"
          : "🧩 Ambiente: Desenvolvimento local"
      );
      console.log(`🔗 CORS liberado para: ${allowedOrigins.join(", ")}`);
    });

    // ✅ Encerramento seguro
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
