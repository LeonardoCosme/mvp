// src/controllers/agendamento_controller.js
import crypto from "node:crypto";
import { Op, Sequelize } from "sequelize";
import {
  Agendamento,
  TipoServico,
  Prestador,
  Contratante,
  Avaliacao,
  Usuario,
} from "../models/index.js";

/** 🔹 Gera token randômico para QR */
function genToken() {
  return crypto.randomBytes(16).toString("hex");
}

/** 🔹 Normaliza payload do POST /agendamentos */
function normalizeCreate(body = {}) {
  const out = {
    tipo_servico_id: Number(body.tipo_servico_id),
    data: String(body.data || "").trim(), // YYYY-MM-DD
    hora: String(body.hora || "").trim(), // HH:MM(:SS)
    endereco: body.endereco ? String(body.endereco).trim() : null,
    descricao: body.descricao ? String(body.descricao).trim() : null,
    duracao_horas:
      body.duracao_horas != null
        ? Number(String(body.duracao_horas).replace(",", "."))
        : null,
  };

  // se vier "16:40", transforma em "16:40:00"
  if (out.hora && out.hora.length === 5) out.hora = `${out.hora}:00`;

  return out;
}

function isISODate(d) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(d || ""));
}
function isTime(h) {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(String(h || ""));
}

/** ✅ POST /api/agendamentos — cria novo agendamento (status: pendente) */
export async function create(req, res) {
  try {
    const userId = req.user.id;
    const payload = normalizeCreate(req.body);

    if (!payload.tipo_servico_id) {
      return res.status(400).json({ error: "tipo_servico_id é obrigatório." });
    }
    if (!payload.data || !isISODate(payload.data)) {
      return res
        .status(400)
        .json({ error: "Data inválida. Use o formato YYYY-MM-DD." });
    }
    if (!payload.hora || !isTime(payload.hora)) {
      return res
        .status(400)
        .json({ error: "Hora inválida. Use HH:MM ou HH:MM:SS." });
    }
    if (!payload.endereco) {
      return res.status(400).json({ error: "Endereço é obrigatório." });
    }

    const tipo = await TipoServico.findByPk(payload.tipo_servico_id, {
      attributes: ["id"],
    });
    if (!tipo) {
      return res
        .status(404)
        .json({ error: "Tipo de serviço não encontrado." });
    }

    const contr = await Contratante.findOne({
      where: { usuario_id: userId },
      attributes: ["id"],
    });
    if (!contr) {
      return res
        .status(403)
        .json({ error: "Perfil de contratante não encontrado." });
    }

    const novo = await Agendamento.create({
      contratanteId: contr.id,
      prestadorId: null,
      tipoServicoId: payload.tipo_servico_id,
      descricao: payload.descricao || null,
      dataServico: payload.data,
      horaServico: payload.hora,
      duracaoHoras: payload.duracao_horas ?? null,
      endereco: payload.endereco,
      status: "pendente",
    });

    return res.status(201).json({
      id: novo.id,
      prestador_id: novo.prestadorId,
      contratante_id: novo.contratanteId,
      tipo_servico_id: novo.tipoServicoId,
      descricao: novo.descricao,
      data_servico: novo.dataServico,
      hora_servico: novo.horaServico,
      duracao_horas: novo.duracaoHoras,
      endereco: novo.endereco,
      status: novo.status,
      created_at: novo.createdAt,
    });
  } catch (err) {
    console.error("❌ Agendamento.create:", err);
    return res.status(500).json({ error: "Erro ao criar agendamento." });
  }
}

/** ✅ GET /api/agendamentos/cliente — lista agendamentos do contratante logado */
export async function listCliente(req, res) {
  try {
    const userId = req.user.id;

    const contr = await Contratante.findOne({
      where: { usuario_id: userId },
      attributes: ["id"],
    });
    if (!contr) {
      return res
        .status(403)
        .json({ error: "Perfil de contratante não encontrado." });
    }

    const itens = await Agendamento.findAll({
      where: { contratanteId: contr.id },
      include: [
        {
          model: TipoServico,
          as: "tipo",
          attributes: ["id", "nome"],
        },
        {
          model: Avaliacao,
          as: "avaliacao",
          required: false,
          attributes: ["id", "nota", "comentario"],
        },
      ],
      order: [
        ["dataServico", "ASC"],
        ["horaServico", "ASC"],
      ],
    });

    const out = itens.map((a) => ({
      id: a.id,
      prestador_id: a.prestadorId,
      contratante_id: a.contratanteId,
      tipo_servico_id: a.tipoServicoId,
      descricao: a.descricao,
      data_servico: a.dataServico,
      hora_servico: a.horaServico,
      duracao_horas: a.duracaoHoras,
      endereco: a.endereco,
      status: a.status,
      created_at: a.createdAt,
      tipo_nome: a.tipo?.nome ?? null,
      checkin_at: a.checkinAt ?? null,
      start_at: a.startAt ?? null,
      end_at: a.endAt ?? null,
      checkin_used: a.checkinUsed ?? 0,
      start_used: a.startUsed ?? 0,
      end_used: a.endUsed ?? 0,
      avaliacao: a.avaliacao
        ? {
            id: a.avaliacao.id,
            nota: a.avaliacao.nota,
            comentario: a.avaliacao.comentario,
          }
        : null,
    }));

    return res.json(out);
  } catch (err) {
    console.error("❌ Agendamento.listCliente:", err);
    return res
      .status(500)
      .json({ error: "Erro ao listar agendamentos do cliente." });
  }
}

/** ✅ GET /api/agendamentos/pendentes — lista pendentes para prestador */
export async function listPrestadorPendentes(req, res) {
  try {
    if (req.user?.tipo !== "prestador") {
      return res.status(403).json({ error: "Apenas prestadores." });
    }

    const itens = await Agendamento.findAll({
      where: { status: "pendente" },
      include: [
        {
          model: TipoServico,
          as: "tipo",
          attributes: ["id", "nome"],
        },
      ],
      order: [
        ["dataServico", "ASC"],
        ["horaServico", "ASC"],
      ],
    });

    const out = itens.map((a) => ({
      id: a.id,
      prestador_id: a.prestadorId,
      contratante_id: a.contratanteId,
      tipo_servico_id: a.tipoServicoId,
      descricao: a.descricao,
      data_servico: a.dataServico,
      hora_servico: a.horaServico,
      duracao_horas: a.duracaoHoras,
      endereco: a.endereco,
      status: a.status,
      created_at: a.createdAt,
      tipo_nome: a.tipo?.nome ?? null,
    }));

    return res.json(out);
  } catch (err) {
    console.error("❌ Agendamento.listPrestadorPendentes:", err);
    return res.status(500).json({ error: "Erro ao listar agendamentos." });
  }
}

/** ✅ GET /api/agendamentos/prestador — lista aceitos / concluídos do prestador */
export async function listPrestador(req, res) {
  try {
    if (req.user?.tipo !== "prestador") {
      return res.status(403).json({ error: "Apenas prestadores." });
    }

    const prest = await Prestador.findOne({
      where: { usuario_id: req.user.id },
      attributes: ["id"],
    });
    if (!prest) {
      return res
        .status(403)
        .json({ error: "Perfil de prestador não encontrado." });
    }

    const itens = await Agendamento.findAll({
      where: {
        prestadorId: prest.id,
        status: { [Op.in]: ["aceita", "concluida"] },
      },
      include: [
        { model: TipoServico, as: "tipo", attributes: ["id", "nome"] },
        {
          model: Avaliacao,
          as: "avaliacao",
          required: false,
          attributes: ["id", "nota", "comentario"],
        },
      ],
      order: [
        ["dataServico", "ASC"],
        ["horaServico", "ASC"],
      ],
    });

    const out = itens.map((a) => ({
      id: a.id,
      prestador_id: a.prestadorId,
      contratante_id: a.contratanteId,
      tipo_servico_id: a.tipoServicoId,
      descricao: a.descricao,
      data_servico: a.dataServico,
      hora_servico: a.horaServico,
      duracao_horas: a.duracaoHoras,
      endereco: a.endereco,
      status: a.status,
      created_at: a.createdAt,
      tipo_nome: a.tipo?.nome ?? null,
      checkin_at: a.checkinAt ?? null,
      start_at: a.startAt ?? null,
      end_at: a.endAt ?? null,
      avaliacao: a.avaliacao
        ? {
            id: a.avaliacao.id,
            nota: a.avaliacao.nota,
            comentario: a.avaliacao.comentario,
          }
        : null,
    }));

    return res.json(out);
  } catch (err) {
    console.error("❌ Agendamento.listPrestador:", err);
    return res
      .status(500)
      .json({ error: "Erro ao listar agendamentos do prestador." });
  }
}

/** ✅ POST /api/agendamentos/:id/aceitar — prestador aceita um pendente */
export async function accept(req, res) {
  try {
    if (req.user?.tipo !== "prestador") {
      return res.status(403).json({ error: "Apenas prestadores." });
    }

    const usuarioId = req.user.id;
    const agId = Number(req.params.id);
    if (!agId) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const prest = await Prestador.findOne({
      where: { usuario_id: usuarioId },
      attributes: ["id", "usuario_id"],
    });
    if (!prest) {
      return res.status(409).json({
        error: "Complete seu cadastro de prestador antes de aceitar.",
      });
    }

    const ag = await Agendamento.findByPk(agId);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }
    if (ag.status !== "pendente") {
      return res.status(400).json({
        error: "Somente agendamentos pendentes podem ser aceitos.",
      });
    }

    await ag.update({ status: "aceita", prestadorId: prest.id });

    return res.json({ ok: true, id: ag.id, status: ag.status });
  } catch (err) {
    console.error("❌ Agendamento.accept:", err);
    return res.status(500).json({ error: "Erro ao aceitar agendamento." });
  }
}

/** ✅ GET /api/agendamentos/:id/qrcode?phase=checkin|start|end */
export async function qrcode(req, res) {
  try {
    const userId = req.user.id;
    const phase = String(req.query.phase || "").toLowerCase();
    const validPhases = ["checkin", "start", "end"];

    if (!validPhases.includes(phase)) {
      return res.status(400).json({ error: "phase inválida." });
    }

    const ag = await Agendamento.findByPk(req.params.id);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    const contr = await Contratante.findOne({
      where: { usuario_id: userId },
      attributes: ["id"],
    });
    if (!contr || contr.id !== ag.contratanteId) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const tokenField = `${phase}Qr`;
    if (!ag[tokenField]) {
      ag[tokenField] = genToken();
      await ag.save({ fields: [tokenField] });
    }

    const baseUrl =
      process.env.FRONTEND_URL ||
      process.env.APP_URL ||
      `${req.protocol}://${req.get("host")}`;

    const url = `${baseUrl}/scanner/${ag.id}?phase=${phase}&token=${ag[tokenField]}`;

    return res.json({ id: ag.id, phase, token: ag[tokenField], url });
  } catch (err) {
    console.error("❌ Agendamento.qrcode:", err);
    return res.status(500).json({ error: "Erro ao gerar QR." });
  }
}

/** ✅ POST /api/agendamentos/:id/scan { token, phase } */
export async function scan(req, res) {
  try {
    if (req.user?.tipo !== "prestador") {
      return res.status(403).json({ error: "Apenas prestadores." });
    }

    const userId = req.user.id;
    const { token, phase } = req.body;
    const valid = ["checkin", "start", "end"];

    if (!token || !valid.includes(phase)) {
      return res.status(400).json({ error: "Dados inválidos." });
    }

    const ag = await Agendamento.findByPk(req.params.id);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    const prest = await Prestador.findOne({
      where: { usuario_id: userId },
      attributes: ["id"],
    });
    if (!prest) {
      return res
        .status(403)
        .json({ error: "Perfil de prestador não encontrado." });
    }
    if (!ag.prestadorId || ag.prestadorId !== prest.id) {
      return res
        .status(403)
        .json({ error: "Este agendamento não pertence a você." });
    }

    const tokenField = `${phase}Qr`;
    const usedField = `${phase}Used`;
    const timeField = `${phase}At`;

    if (!ag[tokenField]) {
      return res.status(400).json({ error: "QR não gerado." });
    }
    if (ag[usedField]) {
      return res.status(409).json({ error: "QR já utilizado." });
    }
    if (ag[tokenField] !== token) {
      return res.status(400).json({ error: "Token inválido." });
    }

    if (phase === "start" && !ag.checkinAt) {
      return res
        .status(400)
        .json({ error: "Faça check-in antes de iniciar." });
    }
    if (phase === "end" && !ag.startAt) {
      return res.status(400).json({ error: "Inicie antes de encerrar." });
    }

    ag[usedField] = true;
    ag[timeField] = new Date();

    if (phase === "end" && ["aceita", "pendente"].includes(ag.status)) {
      ag.status = "concluida";
    }

    await ag.save();

    return res.json({
      ok: true,
      id: ag.id,
      phase,
      status: ag.status,
      time: ag[timeField],
    });
  } catch (err) {
    console.error("❌ Agendamento.scan:", err);
    return res.status(500).json({ error: "Erro ao validar QR." });
  }
}
