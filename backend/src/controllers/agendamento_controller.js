// src/controllers/agendamento_controller.js
import crypto from "crypto";
import db from "../models/index.js";

const { Agendamento, Contratante, Prestador } = db;

/**
 * Helper genérico para ler campos com nomes diferentes
 * (data_servico, dataServico, etc.)
 */
function getField(instance, ...names) {
  if (!instance) return null;

  for (const name of names) {
    // acesso direto (a.campo)
    if (
      Object.prototype.hasOwnProperty.call(instance, name) &&
      instance[name] != null
    ) {
      return instance[name];
    }
    // acesso via .get() do Sequelize
    if (typeof instance.get === "function") {
      const v = instance.get(name);
      if (v != null) return v;
    }
  }
  return null;
}

/**
 * Gera um token aleatório para QR
 */
function generateQrToken() {
  return crypto.randomBytes(8).toString("hex");
}

/**
 * Gera string que será codificada no QR
 */
function buildQrCodeString(agendamentoId, tipo /* 'START' | 'END' */) {
  return `AGD|${agendamentoId}|${tipo}|${generateQrToken()}`;
}

/**
 * DTO enviado para o frontend
 */
function mapAgendamentoDto(a) {
  if (!a) return null;

  const data = getField(a, "data_servico", "dataServico", "data");
  const hora = getField(a, "hora_servico", "horaServico", "hora");
  const tipoNome = getField(a, "tipo_nome", "tipoNome", "nome_tipo");
  const endereco = getField(a, "endereco");
  const status = (getField(a, "status") || "").toString();

  const duracaoRaw = getField(a, "duracao_horas", "duracaoHoras");
  let duracaoHoras = null;
  if (duracaoRaw != null) {
    const n = Number(duracaoRaw);
    duracaoHoras = Number.isFinite(n) ? n : null;
  }

  const startUsed = !!getField(a, "start_used", "startUsed");
  const startAt = getField(a, "start_at", "startAt");

  const endUsed = !!getField(a, "end_used", "endUsed");
  const endAt = getField(a, "end_at", "endAt");

  // campo de relato no banco: relato_servico
  const relatoServico = getField(a, "relato_servico", "relatoServico");

  return {
    id: a.id,
    status,
    tipo_nome: tipoNome || null,
    data_servico: data || null,
    hora_servico: hora || null,
    endereco: endereco || "",
    duracao_horas: duracaoHoras,
    start_usado: startUsed,
    start_at: startAt,
    end_usado: endUsed,
    end_at: endAt,
    relato_servico: relatoServico || null,
  };
}

/* ==========================================================
   🆕 CRIAR AGENDAMENTO (CONTRATANTE)
   POST /api/agendamentos
========================================================== */
export async function create(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const contratante = await Contratante.findOne({
      where: { usuario_id: userId },
    });

    if (!contratante) {
      return res
        .status(403)
        .json({ error: "Perfil de contratante não encontrado." });
    }

    const body = req.body || {};

    const tipoServicoId = getField(
      body,
      "tipoServicoId",
      "tipo_servico_id",
      "tipoServico",
      "tipo"
    );
    const dataServico = getField(body, "data_servico", "dataServico", "data");
    const horaServico = getField(body, "hora_servico", "horaServico", "hora");
    const descricao = getField(
      body,
      "descricao",
      "descricao_servico",
      "descricaoServico"
    );
    const endereco = getField(body, "endereco", "enderecoServico", "rua");

    if (!tipoServicoId || !dataServico || !horaServico || !endereco) {
      return res.status(400).json({
        error:
          "Campos obrigatórios: tipo de serviço, data, hora e endereço devem ser informados.",
      });
    }

    const novo = await Agendamento.create({
      contratanteId: contratante.id,
      tipoServicoId,
      dataServico,
      horaServico,
      descricao: descricao || "",
      endereco,
      status: "pendente",
    });

    console.log("[AGENDAMENTOS][CREATE]", {
      id: novo.id,
      contratanteId: contratante.id,
      tipoServicoId,
      dataServico,
      horaServico,
    });

    return res.status(201).json(mapAgendamentoDto(novo));
  } catch (err) {
    console.error("❌ Erro ao criar agendamento:", err);

    if (err.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: "Erro de validação ao criar agendamento.",
        detalhes: err.errors?.map((e) => e.message),
      });
    }

    return res
      .status(500)
      .json({ error: "Erro ao criar agendamento no servidor." });
  }
}

/* ==========================================================
   👤 CLIENTE (CONTRATANTE)
   GET /api/agendamentos/cliente
========================================================== */
export async function listCliente(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const contratante = await Contratante.findOne({
      where: { usuario_id: userId },
    });

    if (!contratante) {
      return res
        .status(403)
        .json({ error: "Perfil de contratante não encontrado." });
    }

    const todos = await Agendamento.findAll({
      order: [["id", "ASC"]],
    });

    const filtrados = todos.filter((a) => {
      const cid = getField(a, "contratante_id", "contratanteId");
      return cid != null && String(cid) === String(contratante.id);
    });

    console.log("[AGENDAMENTOS][CLIENTE]", {
      userId,
      contratanteId: contratante.id,
      total: todos.length,
      filtrados: filtrados.map((x) => ({
        id: x.id,
        contratante_id: getField(x, "contratante_id", "contratanteId"),
        status: getField(x, "status"),
      })),
    });

    return res.json(filtrados.map(mapAgendamentoDto));
  } catch (err) {
    console.error("❌ Erro ao listar agendamentos (cliente):", err);
    return res
      .status(500)
      .json({ error: "Erro ao listar agendamentos do cliente." });
  }
}

/* ==========================================================
   🧰 PRESTADOR – MEUS AGENDAMENTOS
   GET /api/agendamentos/prestador
========================================================== */
export async function listPrestador(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const prestador = await Prestador.findOne({
      where: { usuario_id: userId },
    });

    if (!prestador) {
      return res
        .status(403)
        .json({ error: "Perfil de prestador não encontrado." });
    }

    const todos = await Agendamento.findAll({
      order: [["id", "DESC"]],
    });

    const filtrados = todos.filter((a) => {
      const pid = getField(a, "prestador_id", "prestadorId");
      return pid != null && String(pid) === String(prestador.id);
    });

    console.log("[AGENDAMENTOS][PRESTADOR-MEUS]", {
      userId,
      prestadorId: prestador.id,
      total: todos.length,
      filtrados: filtrados.map((x) => ({
        id: x.id,
        prestador_id: getField(x, "prestador_id", "prestadorId"),
        status: getField(x, "status"),
      })),
    });

    return res.json(filtrados.map(mapAgendamentoDto));
  } catch (err) {
    console.error("❌ Erro ao listar agendamentos (prestador):", err);
    return res
      .status(500)
      .json({ error: "Erro ao listar agendamentos do prestador." });
  }
}

/* ==========================================================
   🧰 PRESTADOR – SERVIÇOS DISPONÍVEIS
   GET /api/agendamentos/disponiveis
========================================================== */
export async function listDisponiveis(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const prestador = await Prestador.findOne({
      where: { usuario_id: userId },
    });

    if (!prestador) {
      return res
        .status(403)
        .json({ error: "Perfil de prestador não encontrado." });
    }

    const todos = await Agendamento.findAll({
      order: [["id", "ASC"]],
    });

    const statusAbertos = [
      "aguardando",
      "aguardando confirmação",
      "disponivel",
      "disponível",
      "pendente",
    ];

    const filtrados = todos.filter((a) => {
      const status = (getField(a, "status") || "").toLowerCase().trim();
      const pid = getField(a, "prestador_id", "prestadorId");
      return pid == null && status && statusAbertos.includes(status);
    });

    console.log("[AGENDAMENTOS][DISPONIVEIS]", {
      userId,
      prestadorId: prestador.id,
      total: todos.length,
      filtrados: filtrados.map((x) => ({
        id: x.id,
        status: getField(x, "status"),
        prestador_id: getField(x, "prestador_id", "prestadorId"),
      })),
    });

    return res.json(filtrados.map(mapAgendamentoDto));
  } catch (err) {
    console.error("❌ Erro ao listar serviços disponíveis:", err);
    return res
      .status(500)
      .json({ error: "Erro ao listar serviços disponíveis." });
  }
}

/* ==========================================================
   ✅ ACEITAR AGENDAMENTO
   POST /api/agendamentos/:id/aceitar
========================================================== */
export async function accept(req, res) {
  try {
    const { id } = req.params;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const prestador = await Prestador.findOne({
      where: { usuario_id: userId },
    });

    if (!prestador) {
      return res
        .status(403)
        .json({ error: "Perfil de prestador não encontrado." });
    }

    const ag = await Agendamento.findByPk(id);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    const jaTemPrestador = getField(ag, "prestador_id", "prestadorId");
    if (
      jaTemPrestador != null &&
      String(jaTemPrestador) !== String(prestador.id)
    ) {
      return res.status(409).json({
        error: "Este serviço já foi aceito por outro prestador.",
      });
    }

    // vincula ao prestador logado
    ag.prestador_id = prestador.id;
    if (typeof ag.set === "function") {
      ag.set("prestador_id", prestador.id);
      ag.set("prestadorId", prestador.id);
    }

    // status aceito
    ag.status = "aceita";
    if (typeof ag.set === "function") {
      ag.set("status", "aceita");
    }

    // Gera QRs de início/fim se ainda não existirem
    let startQr = getField(ag, "start_qr", "startQr");
    let endQr = getField(ag, "end_qr", "endQr");

    if (!startQr) {
      startQr = buildQrCodeString(ag.id, "START");
      if (typeof ag.set === "function") {
        ag.set("start_qr", startQr);
        ag.set("startQr", startQr);
      } else {
        ag.start_qr = startQr;
      }
    }

    if (!endQr) {
      endQr = buildQrCodeString(ag.id, "END");
      if (typeof ag.set === "function") {
        ag.set("end_qr", endQr);
        ag.set("endQr", endQr);
      } else {
        ag.end_qr = endQr;
      }
    }

    await ag.save();

    console.log("[AGENDAMENTOS][ACEITAR]", {
      id: ag.id,
      prestadorId: prestador.id,
      status: ag.status,
      start_qr: startQr,
      end_qr: endQr,
    });

    return res.json(mapAgendamentoDto(ag));
  } catch (err) {
    console.error("❌ Erro ao aceitar agendamento:", err);
    return res
      .status(500)
      .json({ error: "Erro ao aceitar o agendamento." });
  }
}

/* ==========================================================
   ❌ RECUSAR AGENDAMENTO
   POST /api/agendamentos/:id/recusar
========================================================== */
export async function reject(req, res) {
  try {
    const { id } = req.params;

    const ag = await Agendamento.findByPk(id);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    ag.status = "recusada";
    if (typeof ag.set === "function") {
      ag.set("status", "recusada");
    }

    await ag.save();

    console.log("[AGENDAMENTOS][RECUSAR]", {
      id: ag.id,
      status: ag.status,
    });

    return res.json(mapAgendamentoDto(ag));
  } catch (err) {
    console.error("❌ Erro ao recusar agendamento:", err);
    return res
      .status(500)
      .json({ error: "Erro ao recusar o agendamento." });
  }
}

/* ==========================================================
   📤 QR CODES (CONTRATANTE / PRESTADOR)
   GET /api/agendamentos/:id/qrcode
========================================================== */
export async function qrcode(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const { id } = req.params;
    const ag = await Agendamento.findByPk(id);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    const contratante = await Contratante.findOne({
      where: { usuario_id: userId },
    });
    const prestador = await Prestador.findOne({
      where: { usuario_id: userId },
    });

    const agContratanteId = getField(ag, "contratante_id", "contratanteId");
    const agPrestadorId = getField(ag, "prestador_id", "prestadorId");

    const isContratanteDono =
      contratante && String(contratante.id) === String(agContratanteId);
    const isPrestadorDono =
      prestador && String(prestador.id) === String(agPrestadorId);

    if (!isContratanteDono && !isPrestadorDono) {
      return res.status(403).json({
        error: "Você não tem permissão para ver os QRs deste agendamento.",
      });
    }

    // Garante que existam QR codes, se o serviço já foi aceito
    const status = (getField(ag, "status") || "").toLowerCase();
    let startQr = getField(ag, "start_qr", "startQr");
    let endQr = getField(ag, "end_qr", "endQr");

    if (status === "aceita" || status === "concluida") {
      let precisaSalvar = false;

      if (!startQr) {
        startQr = buildQrCodeString(ag.id, "START");
        if (typeof ag.set === "function") {
          ag.set("start_qr", startQr);
          ag.set("startQr", startQr);
        } else {
          ag.start_qr = startQr;
        }
        precisaSalvar = true;
      }

      if (!endQr) {
        endQr = buildQrCodeString(ag.id, "END");
        if (typeof ag.set === "function") {
          ag.set("end_qr", endQr);
          ag.set("endQr", endQr);
        } else {
          ag.end_qr = endQr;
        }
        precisaSalvar = true;
      }

      if (precisaSalvar) {
        await ag.save();
      }
    }

    const startUsed = !!getField(ag, "start_used", "startUsed");
    const startAt = getField(ag, "start_at", "startAt");

    const endUsed = !!getField(ag, "end_used", "endUsed");
    const endAt = getField(ag, "end_at", "endAt");

    return res.json({
      id: ag.id,
      status: getField(ag, "status"),
      start: {
        code: startQr || null,
        used: startUsed,
        usedAt: startAt,
      },
      end: {
        code: endQr || null,
        used: endUsed,
        usedAt: endAt,
      },
    });
  } catch (err) {
    console.error("❌ Erro ao obter QRCode:", err);
    return res
      .status(500)
      .json({ error: "Erro ao obter QRCode do agendamento." });
  }
}

/* ==========================================================
   📥 SCAN DO QR (PRESTADOR)
   POST /api/agendamentos/:id/scan
   body: { code: string, tipo?: 'start' | 'end', relato?: string }
========================================================== */
export async function scan(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const { id } = req.params;
    const { code, tipo } = req.body || {};

    // aceita vários nomes para o texto do relato, mas sempre grava em relato_servico
    const relato = getField(
      req.body || {},
      "relato",
      "relato_servico",
      "relatoServico",
      "descricaoServico",
      "descricao_servico"
    );

    if (!code) {
      return res
        .status(400)
        .json({ error: "Código do QR não informado no body." });
    }

    const prestador = await Prestador.findOne({
      where: { usuario_id: userId },
    });

    if (!prestador) {
      return res
        .status(403)
        .json({ error: "Perfil de prestador não encontrado." });
    }

    const ag = await Agendamento.findByPk(id);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    const agPrestadorId = getField(ag, "prestador_id", "prestadorId");
    if (!agPrestadorId || String(agPrestadorId) !== String(prestador.id)) {
      return res.status(403).json({
        error: "Este agendamento não está vinculado a este prestador.",
      });
    }

    // Descobre se é QR de início ou fim
    let kind = tipo;
    if (!kind && typeof code === "string") {
      const upper = code.toUpperCase();
      if (upper.includes("|START|")) kind = "start";
      else if (upper.includes("|END|")) kind = "end";
    }

    if (kind !== "start" && kind !== "end") {
      return res.status(400).json({
        error:
          "Tipo de QR inválido. Informe 'tipo' como 'start' ou 'end', ou use um código padrão AGD|...|START/END|...",
      });
    }

    const now = new Date();

    if (kind === "start") {
      const storedCode = getField(ag, "start_qr", "startQr");
      if (!storedCode || storedCode !== code) {
        return res.status(400).json({ error: "QR de início inválido." });
      }

      const alreadyUsed = !!getField(ag, "start_used", "startUsed");
      if (alreadyUsed) {
        // não dá erro 409 – apenas informa que já foi usado
        return res.json({
          ok: true,
          tipo: "start",
          jaUtilizado: true,
          agendamento: mapAgendamentoDto(ag),
          message: "QR de início já havia sido utilizado.",
        });
      }

      if (typeof ag.set === "function") {
        ag.set("start_used", true);
        ag.set("startUsed", true);
        ag.set("start_at", now);
        ag.set("startAt", now);
      } else {
        ag.start_used = true;
        ag.start_at = now;
      }

      // Garante status pelo menos "aceita"
      const statusAtual = (getField(ag, "status") || "").toLowerCase();
      if (statusAtual === "pendente") {
        ag.status = "aceita";
        ag.set?.("status", "aceita");
      }

      await ag.save();

      return res.json({
        ok: true,
        tipo: "start",
        jaUtilizado: false,
        agendamento: mapAgendamentoDto(ag),
      });
    }

    // kind === 'end'
    const storedCode = getField(ag, "end_qr", "endQr");
    if (!storedCode || storedCode !== code) {
      return res.status(400).json({ error: "QR de finalização inválido." });
    }

    const alreadyUsed = !!getField(ag, "end_used", "endUsed");

    if (!alreadyUsed) {
      // primeira vez que está finalizando
      if (typeof ag.set === "function") {
        ag.set("end_used", true);
        ag.set("endUsed", true);
        ag.set("end_at", now);
        ag.set("endAt", now);
      } else {
        ag.end_used = true;
        ag.end_at = now;
      }

      // Calcula duração se tivermos start_at
      const startAt = getField(ag, "start_at", "startAt");
      if (startAt) {
        const inicio = new Date(startAt);
        const diffMs = now.getTime() - inicio.getTime();
        const horas = diffMs / (1000 * 60 * 60); // ms -> horas

        if (typeof ag.set === "function") {
          ag.set("duracao_horas", horas);
          ag.set("duracaoHoras", horas);
        } else {
          ag.duracao_horas = horas;
        }
      }

      // Marca como concluída
      ag.status = "concluida";
      ag.set?.("status", "concluida");
    }

    // Relato do serviço feito pelo prestador
    if (relato && typeof relato === "string" && relato.trim()) {
      if (typeof ag.set === "function") {
        ag.set("relato_servico", relato.trim());
        ag.set("relatoServico", relato.trim());
      } else {
        ag.relato_servico = relato.trim();
      }
    }

    await ag.save();

    return res.json({
      ok: true,
      tipo: "end",
      jaUtilizado: alreadyUsed,
      agendamento: mapAgendamentoDto(ag),
    });
  } catch (err) {
    console.error("❌ Erro ao processar scan de QR:", err);
    return res
      .status(500)
      .json({ error: "Erro ao processar leitura do QR code." });
  }
}

/* ==========================================================
   ✏️ EDITAR AGENDAMENTO (CONTRATANTE)
   PUT /api/agendamentos/:id
========================================================== */
export async function update(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const { id } = req.params;

    const contratante = await Contratante.findOne({
      where: { usuario_id: userId },
    });

    if (!contratante) {
      return res
        .status(403)
        .json({ error: "Perfil de contratante não encontrado." });
    }

    const ag = await Agendamento.findByPk(id);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    const agContratanteId = getField(ag, "contratante_id", "contratanteId");
    if (
      !agContratanteId ||
      String(agContratanteId) !== String(contratante.id)
    ) {
      return res.status(403).json({
        error: "Você não tem permissão para editar este agendamento.",
      });
    }

    // Só deixa editar se ainda estiver em aberto
    const statusAtual = (getField(ag, "status") || "").toLowerCase();
    const editaveis = [
      "pendente",
      "aguardando",
      "aguardando confirmação",
      "disponivel",
      "disponível",
    ];
    if (!editaveis.includes(statusAtual)) {
      return res.status(400).json({
        error: "Este agendamento não pode mais ser editado.",
      });
    }

    const body = req.body || {};
    const novaData = getField(body, "data_servico", "dataServico", "data");
    const novaHora = getField(body, "hora_servico", "horaServico", "hora");
    const novoEndereco = getField(body, "endereco");
    const observacao = getField(body, "observacao", "descricao");

    if (novaData) {
      ag.set?.("dataServico", novaData);
      ag.set?.("data_servico", novaData);
    }
    if (novaHora) {
      ag.set?.("horaServico", novaHora);
      ag.set?.("hora_servico", novaHora);
    }
    if (novoEndereco) {
      ag.set?.("endereco", novoEndereco);
    }
    if (observacao) {
      ag.set?.("descricao", observacao);
    }

    await ag.save();

    console.log("[AGENDAMENTOS][UPDATE]", {
      id: ag.id,
      data_servico: getField(ag, "data_servico", "dataServico"),
      hora_servico: getField(ag, "hora_servico", "horaServico"),
      endereco: getField(ag, "endereco"),
    });

    return res.json(mapAgendamentoDto(ag));
  } catch (err) {
    console.error("❌ Erro ao atualizar agendamento:", err);
    return res
      .status(500)
      .json({ error: "Erro ao atualizar o agendamento." });
  }
}

/* ==========================================================
   🗑️ CANCELAR / EXCLUIR AGENDAMENTO (CONTRATANTE)
   DELETE /api/agendamentos/:id
========================================================== */
export async function remove(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const { id } = req.params;

    const contratante = await Contratante.findOne({
      where: { usuario_id: userId },
    });

    if (!contratante) {
      return res
        .status(403)
        .json({ error: "Perfil de contratante não encontrado." });
    }

    const ag = await Agendamento.findByPk(id);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    const agContratanteId = getField(ag, "contratante_id", "contratanteId");
    if (
      !agContratanteId ||
      String(agContratanteId) !== String(contratante.id)
    ) {
      return res.status(403).json({
        error: "Você não tem permissão para cancelar este agendamento.",
      });
    }

    const statusAtual = (getField(ag, "status") || "").toLowerCase();
    const cancelaveis = [
      "pendente",
      "aguardando",
      "aguardando confirmação",
      "disponivel",
      "disponível",
    ];
    if (!cancelaveis.includes(statusAtual)) {
      return res.status(400).json({
        error: "Este agendamento não pode mais ser cancelado.",
      });
    }

    // Marca como cancelada (mantém registro para histórico)
    if (typeof ag.set === "function") {
      ag.set("status", "cancelada");
    } else {
      ag.status = "cancelada";
    }

    await ag.save();

    console.log("[AGENDAMENTOS][REMOVE]", {
      id: ag.id,
      contratanteId: contratante.id,
      status: ag.status,
    });

    return res.json(mapAgendamentoDto(ag));
  } catch (err) {
    console.error("❌ Erro ao cancelar/excluir agendamento:", err);
    return res
      .status(500)
      .json({ error: "Erro ao cancelar o agendamento." });
  }
}

/* ==========================================================
   🆕 EDITAR RELATO DO SERVIÇO (PRESTADOR)
   PUT /api/agendamentos/:id/relato
   body: { relato: string | null }
========================================================== */
export async function atualizarRelatoServico(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    // Prestador logado
    const prestador = await Prestador.findOne({
      where: { usuario_id: userId },
      attributes: ["id"],
    });

    if (!prestador) {
      return res
        .status(403)
        .json({ error: "Somente prestadores podem editar o relato." });
    }

    const agId = Number(req.params.id);
    if (!agId) {
      return res.status(400).json({ error: "ID de agendamento inválido." });
    }

    const ag = await Agendamento.findByPk(agId);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    const agPrestadorId = getField(ag, "prestador_id", "prestadorId");
    if (!agPrestadorId || String(agPrestadorId) !== String(prestador.id)) {
      return res.status(403).json({
        error: "Este agendamento não está vinculado a este prestador.",
      });
    }

    const statusAtual = (getField(ag, "status") || "").toLowerCase();
    if (statusAtual !== "concluida") {
      return res.status(400).json({
        error: "Só é possível editar o relato de serviços concluídos.",
      });
    }

    // lê o texto do body em vários formatos e normaliza
    const rawRelato = getField(
      req.body || {},
      "relato",
      "relato_servico",
      "relatoServico",
      "descricaoServico",
      "descricao_servico",
      "descricao"
    );

    let relato = rawRelato == null ? null : String(rawRelato).trim();
    if (relato === "") relato = null;

    if (typeof ag.set === "function") {
      ag.set("relato_servico", relato);
      ag.set("relatoServico", relato);
    } else {
      ag.relato_servico = relato;
    }

    await ag.save();

    console.log("[AGENDAMENTOS][RELATO-UPDATE]", {
      id: ag.id,
      prestadorId: prestador.id,
      relato,
    });

    return res.json(mapAgendamentoDto(ag));
  } catch (err) {
    console.error("❌ atualizarRelatoServico:", err);
    return res
      .status(500)
      .json({ error: "Erro ao atualizar o relato do serviço." });
  }
}

// Export default para compatibilidade
export default {
  create,
  listCliente,
  listPrestador,
  listDisponiveis,
  accept,
  reject,
  qrcode,
  scan,
  update,
  remove,
  atualizarRelatoServico,
};
