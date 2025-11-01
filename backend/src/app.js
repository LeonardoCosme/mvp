// backend/src/app.js
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

/* -------------------------------------------
   🔧 Middlewares globais
------------------------------------------- */
app.use(cors({
  origin: '*', // Em produção, substitua por: ['https://seusite.com']
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // Para JSON no body das requisições
app.use(express.urlencoded({ extended: true })); // Para formulários

/* -------------------------------------------
   🚀 Rotas principais da API
------------------------------------------- */
// Todas as rotas do sistema passam pelo prefixo /api
app.use('/api', routes);

/* -------------------------------------------
   ❤️ Healthcheck / rota padrão
------------------------------------------- */

// Healthcheck específico usado pelo Railway (keep-alive)
app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    message: '💚 Servidor ativo e saudável!',
    timestamp: new Date().toISOString()
  });
});

// Página inicial simples (rota raiz)
app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: '🌐 API Marido de Aluguel rodando com sucesso!',
    endpoints: {
      login: '/api/auth/login',
      register: '/api/auth/register',
      forgotPassword: '/api/user/forgot-password',
      resetPassword: '/api/user/reset-password',
      health: '/health'
    }
  });
});

/* -------------------------------------------
   ⚠️ Tratamento genérico de erros
------------------------------------------- */
app.use((err, req, res, next) => {
  console.error('❌ Erro inesperado:', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

module.exports = app;
