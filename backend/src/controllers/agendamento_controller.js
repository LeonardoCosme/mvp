// src/controllers/agendamento_controller.js
import db from "../models/index.js";

const { Agendamento, Contratante, Prestador } = db;

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
  const observacao = getField(a, "observacao", "obs", "descricao");

  const status =
    getField(a, "status") ||
    ""; // ex.: "Aguardando", "Aceita", "Concluida" etc.

  return {
    id: a.id,
    status,
    tipo_nome: tipoNome || null,
    data_servico: data || null,
    hora_servico: hora || null,
    endereco: endereco || "",
    observacao: observacao ?? null,
  };
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

    const registros = await Agendamento.findAll({
      order: [["id", "ASC"]],
    });

    // filtra somente os agendamentos desse contratante
    const filtrados = registros.filter((a) => {
      const cid =
        getField(a, "contratante_id", "contratanteId", "cliente_id") ??
        undefined;
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

// alias com nome antigo, caso ainda seja usado em algum lugar
export const getAgendamentosCliente = listCliente;

/* ==========================================================
   🧰 PRESTADOR – MEUS AGENDAMENTOS
   GET /api/agendamentos/prestador
   - Lista só agendamentos ligados a esse prestador
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

    const registros = await Agendamento.findAll({
      order: [["id", "ASC"]],
    });

    // filtra só agendamentos desse prestador
    const filtrados = registros.filter((a) => {
      const pid =
        getField(a, "prestador_id", "prestadorId") ??
        undefined;
      return pid === prestador.id;
    });

    const resposta = filtrados.map(mapAgendamentoDto);
    return res.json(resposta);
  } catch (err) {
    console.error("❌ Erro ao listar agendamentos (prestador):", err);
    return res
      .status(500)
      .json({ error: "Erro ao listar agendamentos do prestador." });
  }
}

// alias antigo
export const getAgendamentosPrestador = listPrestador;

/* ==========================================================
   🧰 PRESTADOR – SERVIÇOS DISPONÍVEIS
   GET /api/agendamentos/pendentes
   GET /api/agendamentos/disponiveis
   - Mostra só agendamentos com status "aberto"
========================================================== */
export async function listPrestadorPendentes(req, res) {
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
      const pid =
        getField(a, "prestador_id", "prestadorId") ??
        undefined;

      // só considera "disponível" se ainda NÃO está ligado a outro prestador
      return statusAbertos.includes(status) && !pid;
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

// alias antigo
export const getAgendamentosDisponiveis = listPrestadorPendentes;

/* ==========================================================
   ✅ ACEITAR AGENDAMENTO
   POST /api/agendamentos/:id/aceitar
   - Marca como "Aceita"
   - Se existir coluna de prestador, amarra ao prestador logado
========================================================== */
export async function accept(req, res) {
  try {
    const { id } = req.params;

    const ag = await Agendamento.findByPk(id);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    // tenta vincular ao prestador logado (se existir na tabela)
    const userId = req.user?.id;
    if (userId) {
      const prestador = await Prestador.findOne({
        where: { usuario_id: userId },
      });
      if (prestador) {
        ag.prestador_id = prestador.id;
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

// aliases antigos
export const aceitarAgendamento = accept;

/* ==========================================================
   ❌ RECUSAR AGENDAMENTO
   POST /api/agendamentos/:id/recusar
   - Marca como "Recusada"
========================================================== */
export async function reject(req, res) {
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

// alias antigo
export const recusarAgendamento = reject;

/* ==========================================================
   ✏️ Edição de agendamento pelo CONTRATANTE
   PUT /api/agendamentos/:id
========================================================== */
export async function updateAgendamentoContratante(req, res) {
  try {
    const { id } = req.params;
    const { data_servico, hora_servico, observacao } = req.body;

    const agendamento = await Agendamento.findByPk(id);
    if (!agendamento) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    // garante que o usuário logado é o dono (se houver relacionamento)
    const usuarioId = req.user?.id;

    if (usuarioId) {
      const contratante = await Contratante.findOne({
        where: { usuario_id: usuarioId },
      });

      if (contratante) {
        const cid =
          getField(
            agendamento,
            "contratante_id",
            "contratanteId",
            "cliente_id"
          ) ?? null;

        if (cid && cid !== contratante.id) {
          return res
            .status(403)
            .json({ error: "Você não pode editar este agendamento." });
        }
      }
    }

    if (data_servico) agendamento.data_servico = data_servico;
    if (hora_servico) agendamento.hora_servico = hora_servico;
    if (observacao !== undefined) agendamento.observacao = observacao;

    // Sempre que editar, volta a ficar pendente para novo aceite
    agendamento.status = "Pendente";

    await agendamento.save();

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao editar agendamento:", err);
    return res
      .status(500)
      .json({ error: "Erro ao editar o agendamento. Tente novamente." });
  }
}

// Export default para compatibilidade com import default
export default {
  listCliente,
  listPrestador,
  listPrestadorPendentes,
  accept,
  reject,
  updateAgendamentoContratante,
  // aliases antigos
  getAgendamentosCliente: listCliente,
  getAgendamentosPrestador: listPrestador,
  getAgendamentosDisponiveis: listPrestadorPendentes,
  aceitarAgendamento: accept,
  recusarAgendamento: reject,
};
