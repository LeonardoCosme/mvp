// ✅ Imports principais
import express from "express";
import http from "node:http";
import next from "next";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ✅ Importa módulos internos do backend
import models from "./src/models/index.js";
import authRoutes from "./src/routes/authRoutes.js";

// ✅ Configurações iniciais
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔍 Detecta ambiente
const isProduction = process.env.NODE_ENV === "production";
const envPath = isProduction
  ? "/.env" // no Railway, o .env é injetado na raiz do container
  : path.resolve(__dirname, "../.env");

// ✅ Carrega variáveis de ambiente
dotenv.config({ path: envPath });

// 🔍 Logs úteis
console.log("📁 Caminho .env usado:", envPath);
console.log("🔍 DATABASE_URL (server):", process.env.DATABASE_URL);

// ✅ Inicializa Next.js + Express
const dev = !isProduction;
const nextApp = next({
  dev,
  dir: path.resolve(__dirname, "../frontend"),
});
const handle = nextApp.getRequestHandler();
const app = express();

app.use(express.json());

// ✅ Banco de dados
const { sequelize, TipoServico } = models;

// ✅ Função principal
async function startServer() {
  try {
    // 🧠 Prepara o Next.js
    await nextApp.prepare();

    // 🗄️ Conecta ao banco
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

    // ✅ Rotas do backend
    app.use("/api", authRoutes);

    // 🔍 Teste rápido
    app.get("/api/ping", (req, res) => res.send("✅ API ativa e respondendo!"));

    // ⚙️ Integração com Next.js
    app.all("*", (req, res) => handle(req, res));

    // 🚀 Inicia o servidor HTTP
    const port = process.env.PORT || 3000;
    const server = http.createServer(app);

    server.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Servidor rodando em http://localhost:${port}`);
      if (isProduction) console.log("🌐 Ambiente: Produção (Railway)");
      else console.log("🧩 Ambiente: Desenvolvimento local");
    });

    // ✅ Finalização segura
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

// 🚀 Inicializa tudo
startServer();
