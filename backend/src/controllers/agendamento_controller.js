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
   📌 CRIAR NOVO AGENDAMENTO (CONTRATANTE)
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
      body.tipo_servico_id || body.tipoServicoId || body.tipoId || null;
    const dataServico =
      body.data_servico || body.dataServico || body.data || null;
    const horaServico =
      body.hora_servico || body.horaServico || body.hora || null;
    const endereco = body.endereco || "";
    const descricao = body.descricao || body.observacao || "";
    const duracao = body.duracao || null;

    if (!tipoServicoId || !dataServico || !horaServico || !endereco) {
      return res.status(400).json({
        error:
          "Campos obrigatórios: tipo de serviço, data, hora e endereço.",
      });
    }

    const novo = await Agendamento.create({
      contratante_id: contratante.id,
      tipo_servico_id: tipoServicoId,
      descricao,
      data_servico: dataServico,
      hora_servico: horaServico,
      duracao,
      endereco,
      status: "pendente",
    });

    console.log("[AGENDAMENTOS][CREATE]", {
      id: novo.id,
      contratante_id: novo.contratante_id,
      tipo_servico_id: novo.tipo_servico_id,
      status: novo.status,
    });

    return res.status(201).json(mapAgendamentoDto(novo));
  } catch (err) {
    console.error("❌ Erro ao criar agendamento:", err);
    return res.status(500).json({ error: "Erro ao criar agendamento." });
  }
}

/* ==========================================================
   👤 CLIENTE (CONTRATANTE)
   GET /api/agendamentos/cliente
   - Lista só agendamentos do contratante logado
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
   - Lista agendamentos que foram aceitos por este prestador
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
   - Mostra agendamentos ainda não assumidos por nenhum prestador
     com status pendente/aguardando/disponível
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
      // só serviços SEM prestador e com status "aberto"
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
   - Marca como "aceita" e vincula ao prestador logado
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

    // vincula ao prestador logado (tentando os dois nomes de atributo)
    if ("prestador_id" in ag) ag.prestador_id = prestador.id;
    if ("prestadorId" in ag) ag.prestadorId = prestador.id;
    if (typeof ag.set === "function") {
      ag.set("prestador_id", prestador.id);
      ag.set("prestadorId", prestador.id);
    }

    ag.status = "aceita";
    if (typeof ag.set === "function") {
      ag.set("status", "aceita");
    }

    await ag.save();

    console.log("[AGENDAMENTOS][ACEITAR]", {
      id: ag.id,
      prestadorId: prestador.id,
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
   - Marca como "recusada" (não vincula prestador)
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
