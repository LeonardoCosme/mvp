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

    // filtra somente os agendamentos desse contratante
    const filtrados = registros.filter((a) => {
      const cid =
        getField(a, "contratante_id", "contratanteId") ?? undefined;
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
   - Lista só agendamentos ligados a esse prestador
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
      order: [["id", "ASC"]],
    });

    // filtra só agendamentos desse prestador
    const filtrados = registros.filter((a) => {
      const pid = getField(a, "prestador_id", "prestadorId") ?? undefined;
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

/* ==========================================================
   🧰 PRESTADOR – SERVIÇOS DISPONÍVEIS
   GET /api/agendamentos/disponiveis
   - Mostra só agendamentos com status "aberto"
   - A lógica é toda em cima do campo "status"
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

    // pegamos todos e filtramos em memória (garante que não quebra mesmo
    // se nomes de colunas forem um pouco diferentes)
    const registros = await Agendamento.findAll({
      order: [["id", "ASC"]],
    });

    const statusAbertos = ["aguardando", "aguardando confirmação", "disponivel", "disponível", "pendente"];

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
   - Marca como "Aceita"
   - Se existir coluna de prestador, amarra ao prestador logado
========================================================== */
export async function aceitarAgendamento(req, res) {
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
        // se a coluna existir, ótimo; se não existir, isso é ignorado pelo Sequelize
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

/* ==========================================================
   ❌ RECUSAR AGENDAMENTO
   POST /api/agendamentos/:id/recusar
   - Marca como "Recusada"
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

// Export default para compatibilidade, se em algum lugar ainda usarem import default
export default {
  getAgendamentosCliente,
  getAgendamentosPrestador,
  getAgendamentosDisponiveis,
  aceitarAgendamento,
  recusarAgendamento,
};
