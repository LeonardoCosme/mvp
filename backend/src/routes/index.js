const express = require('express');
const router = express.Router();
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

console.log('🔹 Rotas carregadas:');
console.log('Auth:', Object.keys(Auth || {}));
console.log('User:', Object.keys(User || {}));
console.log('Password:', Object.keys(Password || {}));

/* -------------------- 🔐 Autenticação -------------------- */
router.post('/auth/register', Auth.register);
router.post('/auth/login', Auth.login);

/* -------------------- 👤 Usuário -------------------- */
router.get('/user/me', authenticate, User.me);

/* -------------------- 🔑 Recuperação de Senha -------------------- */
router.post('/user/forgot-password', Password.forgotPassword);
router.post('/user/reset-password', Password.resetPassword);

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
router.get('/health', (_req, res) => res.json({ ok: true, message: 'API rodando com sucesso 🚀' }));

module.exports = router;
