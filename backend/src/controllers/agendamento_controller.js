// src/controllers/agendamento_controller.js
import db from "../models/index.js";

const { Agendamento, ServicoDisponivel, Contratante, Prestador } = db;

/**
 * Helper genérico para tentar ler um campo com vários nomes possíveis.
 * Se não achar, devolve null.
 */
function getField(instance, ...names) {
  if (!instance) return null;

  for (const name of names) {
    if (name in instance && instance[name] != null) {
      return instance[name];
    }
    if (typeof instance.get === "function") {
      const v = instance.get(name);
      if (v != null) return v;
    }
  }
  return null;
}

/**
 * Monta o objeto no formato que o frontend espera.
 */
function mapAgendamentoDto(a) {
  if (!a) return null;

  const data = getField(a, "data_servico", "dataServico", "data");
  const hora = getField(a, "hora_servico", "horaServico", "hora");
  const tipoNome = getField(a, "tipo_nome", "tipoNome", "nome_tipo");
  const endereco = getField(a, "endereco");
  const status = getField(a, "status") || "";

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
   👤 CLIENTE (CONTRATANTE)
   GET /api/agendamentos/cliente
   - Lista só agendamentos do contratante logado
========================================================== */
export async function getAgendamentosCliente(req, res) {
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

    const registros = await Agendamento.findAll({
      order: [["id", "ASC"]],
    });

    const filtrados = registros.filter((a) => {
      const cid = getField(a, "contratante_id", "contratanteId") ?? undefined;
      return cid === contratante.id;
    });

    const resposta = filtrados.map(mapAgendamentoDto);
    return res.json(resposta);
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
   - Lista agendamentos do prestador logado
   - Se a coluna de vínculo não estiver clara, CAI NO PLANO B:
     mostra todos os agendamentos com status de "em atendimento"
========================================================== */
export async function getAgendamentosPrestador(req, res) {
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

    const registros = await Agendamento.findAll({
      order: [["id", "DESC"]], // mais recentes primeiro
    });

    // 1º tentativa: filtrar por campo de vínculo (prestador_id / prestadorId)
    let filtrados = registros.filter((a) => {
      const pid = getField(a, "prestador_id", "prestadorId");
      if (pid == null) return false;
      return Number(pid) === Number(prestador.id);
    });

    // Se não achou nada, cai no plano B: mostrar todos que estejam em atendimento
    if (filtrados.length === 0) {
      const statusMeus = [
        "aceita",
        "aceito",
        "em andamento",
        "em andamento (prestador)",
        "concluida",
        "concluída",
      ];
      filtrados = registros.filter((a) => {
        const st = (getField(a, "status") || "").toLowerCase().trim();
        return statusMeus.includes(st);
      });
    }

    const resposta = filtrados.map(mapAgendamentoDto);
    return res.json(resposta);
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
   - Mostra só agendamentos com status "aberto"
========================================================== */
export async function getAgendamentosDisponiveis(req, res) {
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

    const registros = await Agendamento.findAll({
      order: [["id", "ASC"]],
    });

    const statusAbertos = [
      "aguardando",
      "aguardando confirmação",
      "disponivel",
      "disponível",
      "pendente",
    ];

    const filtrados = registros.filter((a) => {
      const status = (getField(a, "status") || "").toLowerCase().trim();
      return statusAbertos.includes(status);
    });

    const resposta = filtrados.map(mapAgendamentoDto);
    return res.json(resposta);
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
export async function aceitarAgendamento(req, res) {
  try {
    const { id } = req.params;

    const ag = await Agendamento.findByPk(id);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    const userId = req.user?.id;
    if (userId) {
      const prestador = await Prestador.findOne({
        where: { usuario_id: userId },
      });
      if (prestador) {
        // tenta atribuir ao prestador logado (se a coluna existir)
        if ("prestador_id" in ag) ag.prestador_id = prestador.id;
        if ("prestadorId" in ag) ag.prestadorId = prestador.id;
      }
    }

    ag.status = "Aceita";
    await ag.save();

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
export async function recusarAgendamento(req, res) {
  try {
    const { id } = req.params;

    const ag = await Agendamento.findByPk(id);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    ag.status = "Recusada";
    await ag.save();

    return res.json(mapAgendamentoDto(ag));
  } catch (err) {
    console.error("❌ Erro ao recusar agendamento:", err);
    return res
      .status(500)
      .json({ error: "Erro ao recusar o agendamento." });
  }
}

/* ==========================================================
   ✏️ EDITAR AGENDAMENTO (CONTRATANTE)
   PUT /api/agendamentos/:id
========================================================== */
export async function updateAgendamentoCliente(req, res) {
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

    const { id } = req.params;
    const ag = await Agendamento.findByPk(id);

    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    const cid = getField(ag, "contratante_id", "contratanteId");
    if (cid == null || Number(cid) !== Number(contratante.id)) {
      return res
        .status(403)
        .json({ error: "Agendamento não pertence a este contratante." });
    }

    const {
      data_servico,
      dataServico,
      hora_servico,
      horaServico,
      endereco,
      observacao,
    } = req.body || {};

    if (data_servico || dataServico) {
      ag.data_servico = data_servico || dataServico;
    }
    if (hora_servico || horaServico) {
      ag.hora_servico = hora_servico || horaServico;
    }
    if (endereco) {
      ag.endereco = endereco;
    }
    if (observacao && "observacao" in ag) {
      ag.observacao = observacao;
    }

    // marca como pendente após edição
    ag.status = "Pendente (editado pelo contratante)";

    await ag.save();
    return res.json(mapAgendamentoDto(ag));
  } catch (err) {
    console.error("❌ Erro ao atualizar agendamento (cliente):", err);
    return res
      .status(500)
      .json({ error: "Erro ao atualizar o agendamento." });
  }
}

/* ==========================================================
   🗑️ CANCELAR AGENDAMENTO (CONTRATANTE)
   DELETE /api/agendamentos/:id
========================================================== */
export async function deleteAgendamentoCliente(req, res) {
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

    const { id } = req.params;
    const ag = await Agendamento.findByPk(id);

    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    const cid = getField(ag, "contratante_id", "contratanteId");
    if (cid == null || Number(cid) !== Number(contratante.id)) {
      return res
        .status(403)
        .json({ error: "Agendamento não pertence a este contratante." });
    }

    await ag.destroy();
    return res.status(204).send();
  } catch (err) {
    console.error("❌ Erro ao cancelar agendamento (cliente):", err);
    return res
      .status(500)
      .json({ error: "Erro ao cancelar o agendamento." });
  }
}

/* ==========================================================
   📅 CREATE (MVP / PLACEHOLDER)
   POST /api/agendamentos
========================================================== */
export async function create(req, res) {
  // placeholder só para não quebrar rota antiga.
  return res.status(501).json({
    error:
      "Criação de agendamento não está implementada neste controlador (MVP).",
  });
}

// Export default para compatibilidade
export default {
  getAgendamentosCliente,
  getAgendamentosPrestador,
  getAgendamentosDisponiveis,
  aceitarAgendamento,
  recusarAgendamento,
  updateAgendamentoCliente,
  deleteAgendamentoCliente,
  create,
};
