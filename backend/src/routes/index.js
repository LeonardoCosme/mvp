const express = require('express');
const router = express.Router();

// Middleware
const authenticate = require('../middleware/authenticate');

// Controllers
const Auth = require('../controllers/auth_controller');
const User = require('../controllers/user_controller');
const Password = require('../controllers/password_controller');
const Prest = require('../controllers/prestador_controller');
const Contr = require('../controllers/contratante_controller');
const Cat = require('../controllers/catalogo_controller');
const Ag = require('../controllers/agendamento_controller');
const Aval = require('../controllers/avaliacao_controller');
const Historico = require('../controllers/historico_controller');

// Logs (somente em modo dev)
if (process.env.NODE_ENV !== 'production') {
  console.log('🔹 Rotas carregadas:');
  console.log('Auth:', Object.keys(Auth || {}));
  console.log('User:', Object.keys(User || {}));
  console.log('Password:', Object.keys(Password || {}));
  console.log('Prestador:', Object.keys(Prest || {}));
  console.log('Contratante:', Object.keys(Contr || {}));
  console.log('Catálogo:', Object.keys(Cat || {}));
  console.log('Agendamentos:', Object.keys(Ag || {}));
  console.log('Avaliações:', Object.keys(Aval || {}));
  console.log('Histórico:', Object.keys(Historico || {}));
}

/* -------------------- 🔐 Autenticação -------------------- */
router.post('/auth/register', Auth.register);
router.post('/auth/login', Auth.login);

/* -------------------- 👤 Usuário -------------------- */
router.get('/user/me', authenticate, User.me);

/* -------------------- ✉️ Recuperação e redefinição de senha -------------------- */
if (Password?.forgotPassword && Password?.resetPassword) {
  router.post('/user/forgot-password', Password.forgotPassword);
  router.post('/user/reset-password', Password.resetPassword);
} else {
  console.error('⚠️ Controlador de senha (Password) não possui métodos válidos.');
}

/* -------------------- 🧰 Prestador -------------------- */
router.get('/prestador/me', authenticate, Prest.me);
router.post('/prestador', authenticate, Prest.save);

/* -------------------- 🧾 Contratante -------------------- */
router.post('/contratante', authenticate, Contr.save);

/* -------------------- 📚 Catálogo -------------------- */
router.get('/tipos-servico', Cat.listTipos);

/* -------------------- 📅 Agendamentos -------------------- */
router.post('/agendamentos', authenticate, Ag.create);
router.get('/agendamentos/cliente', authenticate, Ag.listCliente);
router.get('/agendamentos/pendentes', authenticate, Ag.listPrestadorPendentes);

if (typeof Ag.listPrestador === 'function') {
  router.get('/agendamentos/prestador', authenticate, Ag.listPrestador);
} else {
  console.warn('⚠️ Ag.listPrestador não encontrado.');
}

router.post('/agendamentos/:id/aceitar', authenticate, Ag.accept);
router.get('/agendamentos/:id/status', authenticate, Ag.status);
router.get('/agendamentos/:id/qrcode', authenticate, Ag.qrcode);
router.post('/agendamentos/:id/scan', authenticate, Ag.scan);

/* -------------------- ⭐ Avaliações -------------------- */
router.post('/avaliacoes', authenticate, Aval.create);
if (typeof Aval.resumoPrestador === 'function') {
  router.get('/avaliacoes/resumo/:prestadorId', authenticate, Aval.resumoPrestador);
}

/* -------------------- 🕓 Histórico -------------------- */
if (typeof Historico.historicoCliente === 'function') {
  router.get('/historico/cliente', authenticate, Historico.historicoCliente);
}

/* -------------------- 🩺 Healthcheck -------------------- */
router.get('/health', (_req, res) => res.json({
  ok: true,
  message: '✅ API rodando com sucesso 🚀'
}));

module.exports = router;
