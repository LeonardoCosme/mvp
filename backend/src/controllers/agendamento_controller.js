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

/** Util: token randômico para QR */
function genToken() {
  return crypto.randomBytes(16).toString("hex");
}

/** Normaliza payload do POST /agendamentos */
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
  if (out.hora && out.hora.length === 5) out.hora = `${out.hora}:00`;
  return out;
}
function isISODate(d) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(d || ""));
}
function isTime(h) {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(String(h || ""));
}

/** POST /api/agendamentos — cria agendamento (status: pendente) */
export async function create(req, res) {
  try {
    const userId = req.user.id;
    const payload = normalizeCreate(req.body);

    if (!payload.tipo_servico_id)
      return res.status(400).json({ error: "tipo_servico_id é obrigatório." });
    if (!payload.data || !isISODate(payload.data))
      return res.status(400).json({ error: "Data inválida. Use YYYY-MM-DD." });
    if (!payload.hora || !isTime(payload.hora))
      return res
        .status(400)
        .json({ error: "Hora inválida. Use HH:MM ou HH:MM:SS." });
    if (!payload.endereco)
      return res.status(400).json({ error: "Endereço é obrigatório." });

    const tipo = await TipoServico.findByPk(payload.tipo_servico_id, {
      attributes: ["id"],
    });
    if (!tipo)
      return res.status(404).json({ error: "Tipo de serviço não encontrado." });

    const contr = await Contratante.findOne({
      where: { usuario_id: userId },
      attributes: ["id"],
    });
    if (!contr)
      return res
        .status(403)
        .json({ error: "Perfil de contratante não encontrado." });

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

/** GET /api/agendamentos/cliente — lista do contratante logado */
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
          required: false,
        },
      ],
      order: [
        [Sequelize.col("Agendamento.data_servico"), "ASC"],
        [Sequelize.col("Agendamento.hora_servico"), "ASC"],
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
    }));

    return res.json(out);
  } catch (err) {
    console.error("❌ Agendamento.listCliente:", err);
    return res
      .status(500)
      .json({ error: "Erro ao listar agendamentos do cliente." });
  }
}

/** GET /api/agendamentos/pendentes — lista para prestador (ainda não aceitos) */
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
          required: false,
        },
      ],
      order: [
        [Sequelize.col("Agendamento.data_servico"), "ASC"],
        [Sequelize.col("Agendamento.hora_servico"), "ASC"],
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
    return res
      .status(500)
      .json({ error: "Erro ao listar agendamentos pendentes." });
  }
}

/** GET /api/agendamentos/prestador — lista aceita/concluída do prestador logado */
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
        {
          model: TipoServico,
          as: "tipo",
          attributes: ["id", "nome"],
          required: false,
        },
      ],
      order: [
        [Sequelize.col("Agendamento.data_servico"), "ASC"],
        [Sequelize.col("Agendamento.hora_servico"), "ASC"],
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
    }));

    return res.json(out);
  } catch (err) {
    console.error("❌ Agendamento.listPrestador:", err);
    return res
      .status(500)
      .json({ error: "Erro ao listar agendamentos do prestador." });
  }
}

/** POST /api/agendamentos/:id/aceitar — prestador aceita um pendente */
export async function accept(req, res) {
  try {
    if (req.user?.tipo !== "prestador") {
      return res.status(403).json({ error: "Apenas prestadores podem aceitar." });
    }

    const usuarioId = req.user.id;
    const agId = Number(req.params.id);
    if (!agId) return res.status(400).json({ error: "ID inválido." });

    const prest = await Prestador.findOne({
      where: { usuario_id: usuarioId },
      attributes: ["id", "usuario_id"],
    });
    if (!prest) {
      return res.status(409).json({
        error:
          "Perfil de prestador não encontrado. Complete seu cadastro de prestador antes de aceitar.",
      });
    }

    const ag = await Agendamento.findByPk(agId);
    if (!ag) return res.status(404).json({ error: "Agendamento não encontrado." });
    if (ag.status !== "pendente") {
      return res
        .status(400)
        .json({ error: "Somente agendamentos pendentes podem ser aceitos." });
    }

    const conflito = await Agendamento.findOne({
      where: {
        prestadorId: prest.id,
        dataServico: ag.dataServico,
        horaServico: ag.horaServico,
        status: { [Op.in]: ["aceita", "concluida"] },
      },
    });
    if (conflito) {
      return res
        .status(409)
        .json({ error: "Conflito de horário para este prestador." });
    }

    await ag.update({ status: "aceita", prestadorId: prest.id });

    return res.json({
      ok: true,
      id: ag.id,
      status: ag.status,
      prestador_id: ag.prestadorId,
    });
  } catch (err) {
    console.error("❌ Agendamento.accept:", err);
    return res.status(500).json({ error: "Erro ao aceitar agendamento." });
  }
}
