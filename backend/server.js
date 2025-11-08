import express from "express";
import cors from "cors";
import http from "node:http";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import models from "./src/models/index.js";
import authRoutes from "./src/routes/authRoutes.js";

// 📁 Caminho do arquivo atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔧 Carrega variáveis de ambiente da raiz do projeto
dotenv.config({ path: path.resolve(__dirname, "../.env") });

console.log("📁 Caminho .env usado:", path.resolve(__dirname, "../.env"));
console.log("🔍 DATABASE_URL (server):", process.env.DATABASE_URL);

// 🚀 Inicializa o app Express
const app = express();

// ✅ Configuração CORS — libera o frontend (Next.js) para acessar o backend
app.use(
  cors({
    origin: "http://localhost:3000", // frontend local
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ✅ Middleware para interpretar JSON
app.use(express.json());

// 🗄️ Importa models
const { sequelize, TipoServico } = models;

// ✅ Função principal do servidor
async function startServer() {
  try {
    // 🔌 Conecta ao banco
    await sequelize.authenticate();
    console.log("✅ Banco conectado com sucesso.");

    await sequelize.sync();
    console.log("✅ Models sincronizados.");

    // 🌱 Cria seeds iniciais
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

    // 🔗 Rotas da API
    app.use("/api", authRoutes);

    // 🔍 Teste simples de status
    app.get("/api/ping", (req, res) => res.send("✅ API ativa e respondendo!"));

    // ⚙️ Inicia o servidor HTTP
    const port = process.env.PORT || 5000;
    const server = http.createServer(app);

    server.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Backend rodando em http://localhost:${port}`);
      console.log("🧩 Ambiente: Desenvolvimento local");
    });

    // 🛑 Encerramento seguro
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

// 🚀 Executa o servidor
startServer();
