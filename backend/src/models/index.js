import Sequelize from "sequelize";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🧩 Força o caminho exato do .env
const rootEnvPath = path.resolve("C:/Users/55119/Desktop/mvp/.env");

// ✅ Carrega o .env
dotenv.config({ path: rootEnvPath });

console.log("🧩 Caminho .env carregado:", rootEnvPath);
console.log("🔍 DATABASE_URL lida:", process.env.DATABASE_URL);

const db = {};
const basename = path.basename(__filename);

// 🔍 Lê URL do banco de dados do .env
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("❌ DATABASE_URL não encontrada no arquivo .env");
}

// 🔧 Conecta ao banco
const sequelize = new Sequelize(databaseUrl, {
  dialect: "mysql",
  logging: false,
});

// 🧩 Importa todos os models da pasta
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

// 🧠 Cria associações (se houver)
for (const modelName of Object.keys(db)) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
}

// ✅ Exporta
db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
