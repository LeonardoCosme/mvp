/* ==========================================================
   📅 AGENDAMENTOS
========================================================== */

// (opcional) se em algum momento existir Ag.create, a rota já está pronta
if (typeof Ag.create === "function") {
  router.post("/agendamentos", authenticate, Ag.create);
}

// 👤 AGENDAMENTOS DO CONTRATANTE LOGADO
router.get("/agendamentos/cliente", authenticate, Ag.listCliente);

// 🧰 AGENDAMENTOS DO PRESTADOR LOGADO (meus agendamentos)
router.get("/agendamentos/prestador", authenticate, Ag.listPrestador);

// 🧰 SERVIÇOS DISPONÍVEIS PARA PRESTADOR
router.get("/agendamentos/disponiveis", authenticate, Ag.listDisponiveis);

// ✅ ACEITAR / ❌ RECUSAR
router.post("/agendamentos/:id/aceitar", authenticate, Ag.accept);
router.post("/agendamentos/:id/recusar", authenticate, Ag.decline);

// ✏️ EDITAR / 🗑️ EXCLUIR (CONTRATANTE)
router.put("/agendamentos/:id", authenticate, Ag.updateCliente);
router.delete("/agendamentos/:id", authenticate, Ag.deleteCliente);

/* ✅ QR Code / Scan – só se existirem no controller */
if (typeof Ag.qrcode === "function") {
  router.get("/agendamentos/:id/qrcode", authenticate, Ag.qrcode);
} else {
  console.warn("⚠️ Rota Ag.qrcode não encontrada.");
}

if (typeof Ag.scan === "function") {
  router.post("/agendamentos/:id/scan", authenticate, Ag.scan);
} else {
  console.warn("⚠️ Rota Ag.scan não encontrada.");
}
