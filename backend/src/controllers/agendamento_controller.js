// src/controllers/agendamento_controller.js
import db from "../models/index.js";

const { Agendamento, Contratante, Prestador } = db;

/**
 * Helper genérico para ler campos com nomes diferentes (data_servico, dataServico, etc.)
 * em instâncias Sequelize
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
 * Helper parecido, mas para o corpo da requisição (objeto plano)
 */
function getBodyField(body = {}, ...names) {
  for (const name of names) {
    if (
      Object.prototype.hasOwnProperty.call(body, name) &&
      body[name] != null &&
      body[name] !== ""
    ) {
      return body[name];
    }
  }
  return null;
}

/**
 * DTO enviado para o frontend
 */
function mapAgendamentoDto(a) {
  if (!a) return null;

  const data = getField(a, "dataServico", "data_servico", "data");
  const hora = getField(a, "horaServico", "hora_servico", "hora");
  const tipoNome = getField(a, "tipo_nome", "tipoNome", "nome_tipo");
  const endereco = getField(a, "endereco");
  const status = (getField(a, "status") || "").toString();

  return {
    id: a.id,
    status,
    tipo_nome: tipoNome || null,
    data_servico: data || null,
    hora_servico: hora || null,
    endereco: endereco || "",
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

    // Aceita várias formas de nome dos campos vindos do frontend
    const tipoServicoId = getBodyField(
      body,
      "tipoServicoId",
      "tipo_servico_id",
      "tipoServico",
      "tipo"
    );
    const dataServico = getBodyField(
      body,
      "dataServico",
      "data_servico",
      "data"
    );
    const horaServico = getBodyField(
      body,
      "horaServico",
      "hora_servico",
      "hora"
    );
    const endereco = getBodyField(body, "endereco", "address") || "";
    const descricao =
      getBodyField(body, "descricao", "descricao_servico", "description") || "";

    if (!tipoServicoId || !dataServico || !horaServico) {
      return res.status(400).json({
        error:
          "Campos obrigatórios não informados (tipo de serviço, data e hora).",
      });
    }

    console.log("[AGENDAMENTOS][CREATE] body recebido =>", body);

    const novo = await Agendamento.create({
      // nomes camelCase que o Sequelize está cobrando (ver erro do Railway)
      contratanteId: contratante.id,
      tipoServicoId,
      dataServico,
      horaServico,
      endereco,
      descricao,
      status: "pendente",
    });

    console.log("[AGENDAMENTOS][CREATE][OK]", {
      id: novo.id,
      contratanteId: novo.contratanteId,
      tipoServicoId: novo.tipoServicoId,
      dataServico: novo.dataServico,
      horaServico: novo.horaServico,
    });

    return res.status(201).json(mapAgendamentoDto(novo));
  } catch (err) {
    console.error("❌ Erro ao criar agendamento:", err);

    // Se for erro de validação do Sequelize, retorna mensagem mais amigável
    if (err.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: "Dados inválidos ao criar agendamento.",
        detalhes: err.errors?.map((e) => e.message) ?? [],
      });
    }

    return res
      .status(500)
      .json({ error: "Erro ao criar agendamento. Tente novamente." });
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
      const cid = getField(a, "contratanteId", "contratante_id");
      return cid != null && String(cid) === String(contratante.id);
    });

    console.log("[AGENDAMENTOS][CLIENTE]", {
      userId,
      contratanteId: contratante.id,
      total: todos.length,
      filtrados: filtrados.map((x) => ({
        id: x.id,
        contratanteId: getField(x, "contratanteId", "contratante_id"),
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
      order: [["id", "DESC"]], // mais recentes primeiro
    });

    const filtrados = todos.filter((a) => {
      const pid = getField(a, "prestadorId", "prestador_id");
      return pid != null && String(pid) === String(prestador.id);
    });

    console.log("[AGENDAMENTOS][PRESTADOR-MEUS]", {
      userId,
      prestadorId: prestador.id,
      total: todos.length,
      filtrados: filtrados.map((x) => ({
        id: x.id,
        prestadorId: getField(x, "prestadorId", "prestador_id"),
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
      const pid = getField(a, "prestadorId", "prestador_id");
      return pid == null && status && statusAbertos.includes(status); // ainda sem prestador
    });

    console.log("[AGENDAMENTOS][DISPONIVEIS]", {
      userId,
      prestadorId: prestador.id,
      total: todos.length,
      filtrados: filtrados.map((x) => ({
        id: x.id,
        status: getField(x, "status"),
        prestadorId: getField(x, "prestadorId", "prestador_id"),
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

    // Se já tiver prestador associado e não for este, não deixa assumir
    const jaTemPrestador = getField(ag, "prestadorId", "prestador_id");
    if (
      jaTemPrestador != null &&
      String(jaTemPrestador) !== String(prestador.id)
    ) {
      return res.status(409).json({
        error: "Este serviço já foi aceito por outro prestador.",
      });
    }

    // vincula ao prestador logado (camelCase!)
    ag.prestadorId = prestador.id;
    if (typeof ag.set === "function") {
      ag.set("prestadorId", prestador.id);
    }

    ag.status = "aceita";
    if (typeof ag.set === "function") {
      ag.set("status", "aceita");
    }

    await ag.save();

    console.log("[AGENDAMENTOS][ACEITAR]", {
      id: ag.id,
      prestadorId: getField(ag, "prestadorId", "prestador_id"),
      status: ag.status,
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

// Export default para compatibilidade (import Ag from ...)
export default {
  create,
  listCliente,
  listPrestador,
  listDisponiveis,
  accept,
  reject,
};
