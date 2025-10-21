// backend/src/routes/index.js
const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');

// Controllers
const Auth      = require('../controllers/auth_controller');
const User      = require('../controllers/user_controller');
const Prest     = require('../controllers/prestador_controller');
const Contr     = require('../controllers/contratante_controller');
const Cat       = require('../controllers/catalogo_controller');
const Ag        = require('../controllers/agendamento_controller');
const Aval      = require('../controllers/avaliacao_controller');
const Historico = require('../controllers/historico_controller'); // ✅ novo

// (Opcional) Logs rápidos — comente em produção
console.log('Auth keys:',      Object.keys(Auth || {}));
console.log('User keys:',      Object.keys(User || {}));
console.log('Prest keys:',     Object.keys(Prest || {}));
console.log('Contr keys:',     Object.keys(Contr || {}));
console.log('Cat keys:',       Object.keys(Cat || {}));
console.log('Ag keys:',        Object.keys(Ag || {}));
console.log('Aval keys:',      Object.keys(Aval || {}));
console.log('Historico keys:', Object.keys(Historico || {}));

/* -------------------- Auth -------------------- */
router.post('/auth/register', Auth.register);
router.post('/auth/login',    Auth.login);

/* -------------------- User -------------------- */
router.get('/user/me', authenticate, User.me);

/* -------------------- Prestador -------------------- */
router.get('/prestador/me', authenticate, Prest.me);
router.post('/prestador',    authenticate, Prest.save);

/* -------------------- Contratante -------------------- */
router.post('/contratante', authenticate, Contr.save);

/* -------------------- Catálogo -------------------- */
router.get('/tipos-servico', Cat.listTipos);

/* -------------------- Agendamentos -------------------- */
// cria (contratante)
router.post('/agendamentos', authenticate, Ag.create);

// lista do contratante logado
router.get('/agendamentos/cliente', authenticate, Ag.listCliente);

// pendentes (visão do prestador)
router.get('/agendamentos/pendentes', authenticate, Ag.listPrestadorPendentes);

// aceitos/concluídos do prestador logado
if (typeof Ag.listPrestador === 'function') {
  router.get('/agendamentos/prestador', authenticate, Ag.listPrestador);
} else {
  console.error('[ROTAS] Ag.listPrestador não encontrado! Verifique controller/export.');
}

// aceitar um agendamento pendente (prestador)
router.post('/agendamentos/:id/aceitar', authenticate, Ag.accept);

// status do agendamento (polling para avaliação do cliente)
router.get('/agendamentos/:id/status', authenticate, Ag.status);

// QR Code: gerar/obter token (contratante dono do agendamento)
router.get('/agendamentos/:id/qrcode', authenticate, Ag.qrcode);

// QR Code: escanear/validar (prestador atribuído)
router.post('/agendamentos/:id/scan', authenticate, Ag.scan);

/* -------------------- Avaliações -------------------- */
// criar avaliação (cliente dono do agendamento)
router.post('/avaliacoes', authenticate, Aval.create);

// (opcional) resumo de notas do prestador
if (typeof Aval.resumoPrestador === 'function') {
  router.get('/avaliacoes/resumo/:prestadorId', authenticate, Aval.resumoPrestador);
}

/* -------------------- Histórico (Contratante) -------------------- */
// ✅ histórico de serviços concluídos do contratante, com avaliação (se houver)
if (typeof Historico.historicoCliente === 'function') {
  router.get('/historico/cliente', authenticate, Historico.historicoCliente);
} else {
  console.error('[ROTAS] Historico.historicoCliente não encontrado! Verifique controller/export.');
}

/* -------------------- Healthcheck -------------------- */
router.get('/health', (_req, res) => res.json({ ok: true }));

module.exports = router;
