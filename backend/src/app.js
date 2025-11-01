// backend/src/app.js
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

/* -------------------------------------------
   🔧 Middlewares globais
------------------------------------------- */
app.use(cors({
  origin: '*', // Em produção, substitua por ['https://mvp-marido-aluguel.vercel.app']
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------------------------------
   🚀 Rotas principais da API
------------------------------------------- */
app.use('/api', routes);

/* -------------------------------------------
   ❤️ Healthcheck e rota raiz
------------------------------------------- */
app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: '🌐 API Marido de Aluguel rodando com sucesso!',
    endpoints: {
      login: '/api/auth/login',
      register: '/api/auth/register',
      forgotPassword: '/api/user/forgot-password',
      resetPassword: '/api/user/reset-password',
      health: '/api/health',
    },
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: '💚 Servidor ativo e saudável!' });
});

/* -------------------------------------------
   ⚠️ Tratamento genérico de erros
------------------------------------------- */
app.use((err, _req, res, _next) => {
  console.error('❌ Erro inesperado:', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

module.exports = app;
