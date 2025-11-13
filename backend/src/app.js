// backend/src/app.js
const express = require('express');
const cors = require('cors');

const app = express();

// ✅ Configuração de CORS (permite acesso do frontend no Vercel)
app.use(
  cors({
    origin: [
      'http://localhost:3000', // ambiente local
      'https://mvp-marido-aluguel.vercel.app', // produção (Vercel)
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ✅ Middleware para JSON
app.use(express.json());

// ✅ Rota de status para healthcheck
app.get('/', (req, res) => {
  res.status(200).send('🚀 API está rodando!');
});

// 🔧 Rota de teste simples
app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// ✅ Aqui você pode adicionar suas rotas principais
// Exemplo: app.use('/api', require('./routes/index'));
//
// Certifique-se de que todas as rotas API começam com /api

module.exports = app;
