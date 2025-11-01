// backend/src/app.js
const express = require('express');
const app = express();

// Middleware para JSON
app.use(express.json());

// ✅ Rota de status para healthcheck
app.get('/', (req, res) => {
  res.status(200).send('🚀 API está rodando!');
});

// 🔧 Exemplo de rota adicional (remova se não usar)
app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// Aqui você pode adicionar outras rotas da sua API
// app.use('/api/servicos', require('./routes/servicos'));

module.exports = app;