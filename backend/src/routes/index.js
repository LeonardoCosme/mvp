import express from "express";
import authenticate from "../middleware/authenticate.js";

// Controllers (usando import * para capturar todas as exports nomeadas)
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

/* -------------------- 🔍 Logs -------------------- */
if (process.env.NODE_ENV !== "production") {
  const controllers = { Auth, User, Password, Prest, Contr, Cat, Ag, Aval, Historico };
  console.log("🔹 Rotas carregadas:");
  for (const [nome, ctrl] of Object.entries(controllers)) {
    console.log(`   ${nome}:`, Object.keys(ctrl || {}));
  }
}

/* -------------------- 🔐 Autenticação -------------------- */
router.post("/auth/register", Auth.register || ((_, res) => res.status(501).json({ error: "register() não implementado" })));
router.post("/auth/login", Auth.login || ((_, res) => res.status(501).json({ error: "login() não implementado" })));

/* -------------------- 👤 Usuário -------------------- */
router.get("/user/me", authenticate, User.me || ((_, res) => res.status(501).json({ error: "me() não implementado" })));

/* -------------------- ✉️ Recuperação e redefinição de senha -------------------- */
router.post("/user/forgot-password", Password.forgotPassword || ((_, res) => res.status(501).json({ error: "forgotPassword() não implementado" })));
router.post("/user/reset-password", Password.resetPassword || ((_, res) => res.status(501).json({ error: "resetPassword() não implementado" })));

/* -------------------- 🧰 Prestador -------------------- */
router.get("/prestador/me", authenticate, Prest.me || ((_, res) => res.status(501).json({ error: "Prest.me() não implementado" })));
router.post("/prestador", authenticate, Prest.save || ((_, res) => res.status(501).json({ error: "Prest.save() não implementado" })));

/* -------------------- 🧾 Contratante -------------------- */
router.post("/contratante", authenticate, Contr.save || ((_, res) => res.status(501).json({ error: "Contr.save() não implementado" })));

/* -------------------- 📚 Catálogo -------------------- */
router.get("/tipos-servico", Cat.listTipos || ((_, res) => res.status(501).json({ error: "listTipos() não implementado" })));

/* -------------------- 📅 Agendamentos -------------------- */
router.post("/agendamentos", authenticate, Ag.create || ((_, res) => res.status(501).json({ error: "Ag.create() não implementado" })));
router.get("/agendamentos/cliente", authenticate, Ag.listCliente || ((_, res) => res.status(501).json({ error: "Ag.listCliente() não implementado" })));
router.get("/agendamentos/pendentes", authenticate, Ag.listPrestadorPendentes || ((_, res) => res.status(501).json({ error: "Ag.listPrestadorPendentes() não implementado" })));
router.get("/agendamentos/prestador", authenticate, Ag.listPrestador || ((_, res) => res.status(501).json({ error: "Ag.listPrestador() não implementado" })));
router.post("/agendamentos/:id/aceitar", authenticate, Ag.accept || ((_, res) => res.status(501).json({ error: "Ag.accept() não implementado" })));
router.get("/agendamentos/:id/status", authenticate, Ag.status || ((_, res) => res.status(501).json({ error: "Ag.status() não implementado" })));
router.get("/agendamentos/:id/qrcode", authenticate, Ag.qrcode || ((_, res) => res.status(501).json({ error: "Ag.qrcode() não implementado" })));
router.post("/agendamentos/:id/scan", authenticate, Ag.scan || ((_, res) => res.status(501).json({ error: "Ag.scan() não implementado" })));

/* -------------------- ⭐ Avaliações -------------------- */
router.post("/avaliacoes", authenticate, Aval.create || ((_, res) => res.status(501).json({ error: "Aval.create() não implementado" })));
router.get("/avaliacoes/resumo/:prestadorId", authenticate, Aval.resumoPrestador || ((_, res) => res.status(501).json({ error: "Aval.resumoPrestador() não implementado" })));

/* -------------------- 🕓 Histórico -------------------- */
router.get("/historico/cliente", authenticate, Historico.historicoCliente || ((_, res) => res.status(501).json({ error: "Historico.historicoCliente() não implementado" })));
router.get("/historico/status/:id", authenticate, Historico.statusCliente || ((_, res) => res.status(501).json({ error: "Historico.statusCliente() não implementado" })));

/* -------------------- 🩺 Healthcheck -------------------- */
router.get("/health", (_req, res) =>
  res.json({ ok: true, message: "✅ API rodando com sucesso 🚀" })
);

/* -------------------- ✅ Export padrão -------------------- */
export default router;
