// backend/src/routes/index.js
const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');

const Auth  = require('../controllers/auth_controller');
const User  = require('../controllers/user_controller');
const Prest = require('../controllers/prestador_controller');
const Contr = require('../controllers/contratante_controller');
const Cat   = require('../controllers/catalogo_controller');
const Ag    = require('../controllers/agendamento_controller');

// Logs rápidos (debug)
console.log('Auth keys:',  Object.keys(Auth || {}));
console.log('User keys:',  Object.keys(User || {}));
console.log('Prest keys:', Object.keys(Prest || {}));
console.log('Contr keys:', Object.keys(Contr || {}));
console.log('Cat keys:',   Object.keys(Cat || {}));
console.log('Ag keys:',    Object.keys(Ag || {}));

// -------------------- Auth --------------------
router.post('/auth/register', Auth.register);
router.post('/auth/login',    Auth.login);

// -------------------- User --------------------
router.get('/user/me', authenticate, User.me);

// -------------------- Prestador --------------------
router.get('/prestador/me', authenticate, Prest.me);
router.post('/prestador',    authenticate, Prest.save);

// -------------------- Contratante --------------------
router.post('/contratante', authenticate, Contr.save);

// -------------------- Catálogo --------------------
router.get('/tipos-servico', Cat.listTipos);

// -------------------- Agendamentos --------------------
// cria (contratante)
router.post('/agendamentos', authenticate, Ag.create);

// lista do contratante logado
router.get('/agendamentos/cliente',   authenticate, Ag.listCliente);

// pendentes (visão do prestador) -> podem ser aceitos
router.get('/agendamentos/pendentes', authenticate, Ag.listPrestadorPendentes);

// ✅ aceitos do prestador logado (NÃO usar "listPrestadorAceitos")
if (typeof Ag.listPrestador === 'function') {
  router.get('/agendamentos/prestador', authenticate, Ag.listPrestador);
} else {
  console.error('[ROTAS] Ag.listPrestador não encontrado! Verifique controller/export.');
}

// aceitar um agendamento pendente (prestador)
router.post('/agendamentos/:id/aceitar', authenticate, Ag.accept);

// ✅ QR Code: gerar/obter token (contratante dono do agendamento)
router.get('/agendamentos/:id/qrcode', authenticate, Ag.qrcode);

// ✅ QR Code: escanear/validar (prestador atribuído)
router.post('/agendamentos/:id/scan', authenticate, Ag.scan);

// -------------------- Healthcheck (opcional) --------------------
router.get('/health', (_req, res) => res.json({ ok: true }));

module.exports = router;
