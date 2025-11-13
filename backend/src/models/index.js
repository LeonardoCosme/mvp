// src/models/index.js
import Sequelize from "sequelize";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";

// ✅ Carrega .env local apenas fora da produção
if (isProduction) {
  const localEnv = path.resolve(__dirname, "../../.env");
  dotenv.config({ path: localEnv });
  console.log("🧩 Ambiente local: .env carregado de", localEnv);
} else {
  console.log("🚀 Ambiente de produção: variáveis do Railway");
}

// 🔍 Verifica URL do banco
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("❌ DATABASE_URL não encontrada!");
}

// 🔧 Conecta ao banco de dados
const sequelize = new Sequelize(databaseUrl, {
  dialect: "mysql",
  logging: false,
});

const db = {};
const basename = path.basename(__filename);

// 🧩 Importa todos os models (compatível com Windows/Linux)
for (const file of fs.readdirSync(__dirname)) {
  if (
    file.indexOf(".") !== 0 &&
    file !== basename &&
    (file.endsWith(".js") || file.endsWith(".mjs"))
  ) {
    const modelPath = path.join(__dirname, file);
    const modelModule = await import(pathToFileURL(modelPath));
    const model =
      modelModule.default?.(sequelize, Sequelize.DataTypes) ||
      modelModule(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  }
}

// 🧠 Cria associações, se existirem
for (const modelName of Object.keys(db)) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
}

// ✅ Adiciona exportações nomeadas para facilitar import nos controllers
const {
  Usuario,
  Prestador,
  Contratante,
  TipoServico,
  Agendamento,
  Avaliacao,
  Historico,
  PasswordResetToken, // 👈 ADICIONADO AQUI
} = db;

// ✅ Exportações nomeadas
export {
  sequelize,
  Sequelize,
  Usuario,
  Prestador,
  Contratante,
  TipoServico,
  Agendamento,
  Avaliacao,
  Historico,
  PasswordResetToken, // 👈 ADICIONADO AQUI
};

// ✅ Exportação default usada em imports dinâmicos
db.sequelize = sequelize;
db.Sequelize = Sequelize;

console.log("📦 Models carregados:", Object.keys(db).join(", "));

export default db;
