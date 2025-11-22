// src/controllers/agendamento_controller.js
import db from "../models/index.js";

const { Agendamento, ServicoDisponivel } = db;

// Função utilitária para montar o objeto que o frontend espera
function mapAgendamentoDto(a) {
  if (!a) return null;

  // Como não temos 100% de certeza dos nomes dos campos,
  // tentamos várias opções seguras (se não existir, fica undefined).
  const data =
    a.data_servico ||
    a.dataServico ||
    a.data ||
    (a.get ? a.get("data_servico") : undefined);

  const hora =
    a.hora_servico ||
    a.horaServico ||
    a.hora ||
    (a.get ? a.get("hora_servico") : undefined);

  const tipoNome =
    a.tipo_nome ||
    a.tipoNome ||
    a.nome_tipo ||
    (a.get ? a.get("tipo_nome") : undefined);

  const endereco =
    a.endereco || (a.get ? a.get("endereco") : undefined);

  return {
    id: a.id,
    status: a.status || (a.get ? a.get("status") : undefined) || "",
    tipo_nome: tipoNome || null,
    data_servico: data || null,
    hora_servico: hora || null,
    endereco: endereco || "",
  };
}

/**
 * GET /api/agendamentos/cliente
 * Por enquanto retorna TODOS os agendamentos cadastrados.
 * (Depois podemos filtrar por usuário/contratante se quisermos.)
 */
export async function getAgendamentosCliente(req, res) {
  try {
    const registros = await Agendamento.findAll({
      order: [["id", "ASC"]],
    });

    const resposta = registros.map(mapAgendamentoDto);
    return res.json(resposta);
  } catch (err) {
    console.error("❌ Erro ao listar agendamentos (cliente):", err);
    return res
      .status(500)
      .json({ error: "Erro ao listar agendamentos do cliente." });
  }
}

/**
 * GET /api/agendamentos/prestador
 * Por enquanto também retorna TODOS os agendamentos.
 * (Depois podemos filtrar por prestador.)
 */
export async function getAgendamentosPrestador(req, res) {
  try {
    const registros = await Agendamento.findAll({
      order: [["id", "ASC"]],
    });

    const resposta = registros.map(mapAgendamentoDto);
    return res.json(resposta);
  } catch (err) {
    console.error("❌ Erro ao listar agendamentos (prestador):", err);
    return res
      .status(500)
      .json({ error: "Erro ao listar agendamentos do prestador." });
  }
}

/**
 * GET /api/agendamentos/disponiveis
 * Usa a tabela ServicoDisponivel para montar os "serviços disponíveis".
 * Se a estrutura for diferente, pelo menos não dá erro – só devolve campos em branco.
 */
export async function getAgendamentosDisponiveis(req, res) {
  try {
    if (!ServicoDisponivel) {
      // Se por algum motivo o model não existir
      return res.json([]);
    }

    const registros = await ServicoDisponivel.findAll({
      order: [["id", "ASC"]],
    });

    // Tentamos mapear campos de forma genérica
    const resposta = registros.map((s) => {
      const base = mapAgendamentoDto(s);
      return {
        ...base,
        // Se o ServicoDisponivel tiver algum campo específico, dá para aproveitar aqui depois
      };
    });

    return res.json(resposta);
  } catch (err) {
    console.error("❌ Erro ao listar serviços disponíveis:", err);
    return res
      .status(500)
      .json({ error: "Erro ao listar serviços disponíveis." });
  }
}

/**
 * POST /api/agendamentos/:id/aceitar
 * Marca o agendamento como "Aceita".
 */
export async function aceitarAgendamento(req, res) {
  try {
    const { id } = req.params;

    const ag = await Agendamento.findByPk(id);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
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

/**
 * POST /api/agendamentos/:id/recusar
 * Marca o agendamento como "Recusada".
 */
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

// Export default para continuar compatível com import default nos routes
export default {
  getAgendamentosCliente,
  getAgendamentosPrestador,
  getAgendamentosDisponiveis,
  aceitarAgendamento,
  recusarAgendamento,
};
