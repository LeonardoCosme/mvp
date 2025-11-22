// src/routes/index.js
import express from "express";
import authenticate from "../middleware/authenticate.js";

// Controllers (ESM)
import * as Auth from "../controllers/auth_Controller.js";
import * as User from "../controllers/user_controller.js";
import * as Password from "../controllers/password_controller.js";
import * as Prest from "../controllers/prestador_controller.js";
import * as Contr from "../controllers/contratante_controller.js";
import * as Cat from "../controllers/catalogo_controller.js";
import * as Ag from "../controllers/agendamento_controller.js";
import * as Aval from "../controllers/avaliacao_controller.js";
import * as Historico from "../controllers/historico_controller.js";

const router = express.Router();

/* ==========================================================
   🔹 LOG DE ROTAS — apenas em desenvolvimento
========================================================== */
if (process.env.NODE_ENV !== "production") {
  console.log("🔹 Rotas carregadas:");
  console.log("   Auth:", Object.keys(Auth || {}));
  console.log("   User:", Object.keys(User || {}));
  console.log("   Password:", Object.keys(Password || {}));
  console.log("   Prest:", Object.keys(Prest || {}));
  console.log("   Contr:", Object.keys(Contr || {}));
  console.log("   Cat:", Object.keys(Cat || {}));
  console.log("   Ag:", Object.keys(Ag || {}));
  console.log("   Aval:", Object.keys(Aval || {}));
  console.log("   Historico:", Object.keys(Historico || {}));
}

/* ==========================================================
   🔐 AUTENTICAÇÃO
========================================================== */
router.post("/auth/register", Auth.register);
router.post("/auth/login", Auth.login);
router.post("/auth/forgot-password", Auth.forgotPassword);

/* ==========================================================
   👤 USUÁRIO
========================================================== */
router.get("/user/me", authenticate, User.me);

/* ==========================================================
   🔑 RECUPERAÇÃO DE SENHA (legado)
========================================================== */
if (Password?.forgotPassword && Password?.resetPassword) {
  router.post("/user/forgot-password", Password.forgotPassword);
  router.post("/user/reset-password", Password.resetPassword);
}

/* ==========================================================
   🧰 PRESTADOR / CONTRATANTE
========================================================== */
router.get("/prestador/me", authenticate, Prest.me);
router.post("/prestador", authenticate, Prest.save);

router.post("/contratante", authenticate, Contr.save);

/* ==========================================================
   📚 CATÁLOGO DE SERVIÇOS
========================================================== */
router.get("/tipos-servico", Cat.listTipos);

/* ==========================================================
   📅 AGENDAMENTOS
========================================================== */
// Cliente (contratante)
router.get("/agendamentos/cliente", authenticate, Ag.listCliente);

// Prestador – meus agendamentos
router.get("/agendamentos/prestador", authenticate, Ag.listPrestador);

// Prestador – serviços disponíveis
router.get("/agendamentos/disponiveis", authenticate, Ag.listDisponiveis);

// Aceitar / Recusar
router.post("/agendamentos/:id/aceitar", authenticate, Ag.accept);
router.post("/agendamentos/:id/recusar", authenticate, Ag.reject);

// QRCode / Scan – só registra se existirem no controller atual
if (typeof Ag.qrcode === "function") {
  router.get("/agendamentos/:id/qrcode", authenticate, Ag.qrcode);
} else {
  console.warn("⚠️ Rota Ag.qrcode não encontrada (opcional).");
}

if (typeof Ag.scan === "function") {
  router.post("/agendamentos/:id/scan", authenticate, Ag.scan);
} else {
  console.warn("⚠️ Rota Ag.scan não encontrada (opcional).");
}

/* ==========================================================
   ⭐ AVALIAÇÕES
========================================================== */
router.post("/avaliacoes", authenticate, Aval.create);
if (typeof Aval.resumoPrestador === "function") {
  router.get(
    "/avaliacoes/resumo/:prestadorId",
    authenticate,
    Aval.resumoPrestador
  );
}

/* ==========================================================
   🕓 HISTÓRICO
========================================================== */
if (typeof Historico.historicoCliente === "function") {
  router.get("/historico/cliente", authenticate, Historico.historicoCliente);
}
if (typeof Historico.statusCliente === "function") {
  router.get("/historico/status/:id", authenticate, Historico.statusCliente);
}

/* ==========================================================
   🩺 HEALTHCHECK
========================================================== */
router.get("/health", (_req, res) =>
  res.json({
    ok: true,
    message: "✅ API rodando com sucesso 🚀",
    timestamp: new Date().toISOString(),
  })
);

/* ==========================================================
   ✅ EXPORT
========================================================== */
export default router;
