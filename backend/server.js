import express from "express";
import http from "node:http";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import models from "./src/models/index.js";
import authRoutes from "./src/routes/authRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

console.log("📁 Caminho .env usado:", path.resolve(__dirname, "../.env"));
console.log("🔍 DATABASE_URL (server):", process.env.DATABASE_URL);

const app = express();
app.use(express.json());

const { sequelize, TipoServico } = models;

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
      console.log("🌱 Seeds automáticos inseridos no banco.");
    } else {
      console.log(`🌱 Seeds já existentes (${count} registros).`);
    }

    // ✅ Rotas do backend
    app.use("/api", authRoutes);
    app.get("/api/ping", (req, res) => res.send("✅ API ativa e respondendo!"));

    // 🚀 Servidor Express puro
    const port = process.env.PORT || 5000;
    const server = http.createServer(app);

    server.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Backend rodando em http://localhost:${port}`);
      console.log("🧩 Ambiente: Desenvolvimento local");
    });

  } catch (error) {
    console.error("❌ Erro ao iniciar servidor:", error);
    process.exit(1);
  }
}

startServer();
