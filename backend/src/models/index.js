import Sequelize from "sequelize";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";

// ✅ Carrega .env local apenas fora da produção
if (!isProduction) {
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

// 🔧 Conecta ao banco
const sequelize = new Sequelize(databaseUrl, {
  dialect: "mysql",
  logging: false,
});

const db = {};
const basename = path.basename(__filename);

// 🧩 Importa models com compatibilidade Windows/Linux
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

// 🧠 Cria associações
for (const modelName of Object.keys(db)) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
}

// ✅ Exporta
db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
