import express from 'express';
import http from 'node:http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import models from './src/models/index.js';
import authRoutes from './src/routes/authRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(express.json());

// ✅ Rotas do backend (Express) — isoladas do Next.js
app.use('/api', authRoutes);
app.get('/api/ping', (req, res) => res.send('✅ API ativa e respondendo!'));

const { sequelize } = models;

await sequelize.authenticate();
console.log('✅ Banco conectado com sucesso.');
await sequelize.sync();
console.log('✅ Models sincronizados.');

const port = process.env.PORT || 3001;
const server = http.createServer(app);
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 API rodando em http://localhost:${port}`);
});
