// src/controllers/agendamento_controller.js
import db from "../models/index.js";

const { Agendamento, Contratante, Prestador } = db;

/**
 * Helper genérico para ler campos com nomes diferentes (data_servico, dataServico, etc.)
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
 * Helper para ler campos do body com vários nomes possíveis
 */
function getBodyField(body, ...names) {
  if (!body) return undefined;
  for (const name of names) {
    if (
      Object.prototype.hasOwnProperty.call(body, name) &&
      body[name] !== undefined &&
      body[name] !== null &&
      body[name] !== ""
    ) {
      return body[name];
    }
  }
  return undefined;
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
   📌 CRIAR AGENDAMENTO (CONTRATANTE)
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

    const tipoServicoId =
      getBodyField(
        body,
        "tipo_servico_id",
        "tipoServicoId",
        "tipo_servico",
        "tipoId",
        "tipo"
      ) ?? null;

    const dataServico =
      getBodyField(body, "data_servico", "dataServico", "data") ?? null;

    const horaServico =
      getBodyField(body, "hora_servico", "horaServico", "hora") ?? null;

    const endereco = getBodyField(body, "endereco", "address") ?? null;

    const descricao =
      getBodyField(body, "descricao", "observacao", "description") ?? null;

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
      endereco,
      descricao,
      status: "pendente",
    });

    console.log("[AGENDAMENTOS][CREATE]", {
      id: novo.id,
      contratanteId: contratante.id,
      tipoServicoId,
      dataServico,
      horaServico,
      endereco,
    });

    return res.status(201).json(mapAgendamentoDto(novo));
  } catch (err) {
    console.error("❌ Erro ao criar agendamento:", err);
    if (err.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: "Erro de validação ao criar agendamento.",
        details: err.errors?.map((e) => e.message) || [],
      });
    }
    return res.status(500).json({ error: "Erro ao criar agendamento." });
  }
}

/* ==========================================================
   👤 CLIENTE (CONTRATANTE) – LISTAR
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
      order: [["id", "DESC"]], // mais recentes primeiro
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

    // Se já tiver prestador associado e não for este, não deixa assumir
    const jaTemPrestador = getField(ag, "prestador_id", "prestadorId");
    if (
      jaTemPrestador != null &&
      String(jaTemPrestador) !== String(prestador.id)
    ) {
      return res.status(409).json({
        error: "Este serviço já foi aceito por outro prestador.",
      });
    }

    ag.prestadorId = prestador.id;
    ag.status = "aceita";

    await ag.save();

    console.log("[AGENDAMENTOS][ACEITAR]", {
      id: ag.id,
      prestadorId: prestador.id,
      status: ag.status,
    });

    return res.json(mapAgendamentoDto(ag));
  } catch (err) {
    console.error("❌ Erro ao aceitar agendamento:", err);
    return res.status(500).json({ error: "Erro ao aceitar o agendamento." });
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
    await ag.save();

    console.log("[AGENDAMENTOS][RECUSAR]", {
      id: ag.id,
      status: ag.status,
    });

    return res.json(mapAgendamentoDto(ag));
  } catch (err) {
    console.error("❌ Erro ao recusar agendamento:", err);
    return res.status(500).json({ error: "Erro ao recusar o agendamento." });
  }
}

/* ==========================================================
   ✏️ EDITAR AGENDAMENTO (CONTRATANTE)
   PUT /api/agendamentos/:id
========================================================== */
export async function update(req, res) {
  try {
    const { id } = req.params;
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

    const ag = await Agendamento.findByPk(id);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    const agContratanteId = getField(ag, "contratante_id", "contratanteId");
    if (String(agContratanteId) !== String(contratante.id)) {
      return res
        .status(403)
        .json({ error: "Você não pode editar este agendamento." });
    }

    const statusAtual = (getField(ag, "status") || "").toLowerCase();
    const podeEditar =
      statusAtual.includes("pendente") ||
      statusAtual.includes("aguardando") ||
      statusAtual.includes("disponivel") ||
      statusAtual.includes("disponível");

    if (!podeEditar) {
      return res.status(400).json({
        error:
          "Este agendamento não pode mais ser editado (já foi aceito, concluído ou cancelado).",
      });
    }

    const body = req.body || {};

    const novaData =
      getBodyField(body, "data_servico", "dataServico", "data") ?? null;
    const novaHora =
      getBodyField(body, "hora_servico", "horaServico", "hora") ?? null;
    const novoEndereco =
      getBodyField(body, "endereco", "address") ?? undefined;
    const observacao =
      getBodyField(body, "observacao", "descricao", "description") ?? undefined;

    if (novaData) ag.dataServico = novaData;
    if (novaHora) ag.horaServico = novaHora;
    if (novoEndereco !== undefined) ag.endereco = novoEndereco;
    if (observacao !== undefined) ag.descricao = observacao;

    await ag.save();

    console.log("[AGENDAMENTOS][UPDATE]", {
      id: ag.id,
      dataServico: ag.dataServico,
      horaServico: ag.horaServico,
      endereco: ag.endereco,
    });

    return res.json(mapAgendamentoDto(ag));
  } catch (err) {
    console.error("❌ Erro ao editar agendamento:", err);
    return res.status(500).json({ error: "Erro ao editar o agendamento." });
  }
}

/* ==========================================================
   🗑️ CANCELAR / APAGAR AGENDAMENTO (CONTRATANTE)
   DELETE /api/agendamentos/:id
========================================================== */
export async function destroy(req, res) {
  try {
    const { id } = req.params;
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

    const ag = await Agendamento.findByPk(id);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    const agContratanteId = getField(ag, "contratante_id", "contratanteId");
    if (String(agContratanteId) !== String(contratante.id)) {
      return res
        .status(403)
        .json({ error: "Você não pode cancelar este agendamento." });
    }

    await ag.destroy(); // remove do banco (combina com o front que tira o card da tela)

    console.log("[AGENDAMENTOS][DESTROY]", {
      id,
      contratanteId: contratante.id,
    });

    return res.status(204).send();
  } catch (err) {
    console.error("❌ Erro ao cancelar agendamento:", err);
    return res
      .status(500)
      .json({ error: "Erro ao cancelar (apagar) o agendamento." });
  }
}

/* ==========================================================
   ✅ EXPORT DEFAULT (compatibilidade)
========================================================== */
export default {
  create,
  listCliente,
  listPrestador,
  listDisponiveis,
  accept,
  reject,
  update,
  destroy,
};
