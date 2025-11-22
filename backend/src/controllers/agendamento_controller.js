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

  const duracaoHoras = getField(a, "duracao_horas", "duracaoHoras");

  const startUsed = !!getField(a, "start_used", "startUsed");
  const startAt = getField(a, "start_at", "startAt");

  const endUsed = !!getField(a, "end_used", "endUsed");
  const endAt = getField(a, "end_at", "endAt");

  return {
    id: a.id,
    status,
    tipo_nome: tipoNome || null,
    data_servico: data || null,
    hora_servico: hora || null,
    endereco: endereco || "",
    duracao_horas: duracaoHoras ?? null,
    // infos para o frontend poder colorir os QRs / mostrar tempo
    start_usado: startUsed,
    start_at: startAt,
    end_usado: endUsed,
    end_at: endAt,
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
    const dataServico = getField(
      body,
      "data_servico",
      "dataServico",
      "data"
    );
    const horaServico = getField(
      body,
      "hora_servico",
      "horaServico",
      "hora"
    );
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
   - Marca como "aceita"
   - Vincula ao prestador logado
   - Gera QR de início e fim (se ainda não existirem)
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
   - Retorna start_qr / end_qr e se já foram usados
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
   body: { code: string, tipo?: 'start' | 'end' }
========================================================== */
export async function scan(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const { id } = req.params;
    const { code, tipo } = req.body || {};

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
        return res
          .status(409)
          .json({ error: "QR de início já foi utilizado." });
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
        agendamento: mapAgendamentoDto(ag),
      });
    }

    // kind === 'end'
    const storedCode = getField(ag, "end_qr", "endQr");
    if (!storedCode || storedCode !== code) {
      return res.status(400).json({ error: "QR de finalização inválido." });
    }

    const alreadyUsed = !!getField(ag, "end_used", "endUsed");
    if (alreadyUsed) {
      return res
        .status(409)
        .json({ error: "QR de finalização já foi utilizado." });
    }

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

    await ag.save();

    return res.json({
      ok: true,
      tipo: "end",
      agendamento: mapAgendamentoDto(ag),
    });
  } catch (err) {
    console.error("❌ Erro ao processar scan de QR:", err);
    return res
      .status(500)
      .json({ error: "Erro ao processar leitura do QR code." });
  }
}

// Export default para compatibilidade (import Ag from ...)
export default {
  create,
  listCliente,
  listPrestador,
  listDisponiveis,
  accept,
  reject,
  qrcode,
  scan,
};
