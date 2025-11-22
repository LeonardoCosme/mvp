// src/controllers/agendamento_controller.js
import db from "../models/index.js";

const { Agendamento, ServicoDisponivel } = db;

// ---------------------------------------------------------------------
// Função utilitária para montar o objeto que o frontend espera
// ---------------------------------------------------------------------
function mapAgendamentoDto(a) {
  if (!a) return null;

  const safeGet = (obj, field) =>
    obj?.[field] ?? (obj?.get ? obj.get(field) : undefined);

  const data =
    safeGet(a, "data_servico") ||
    safeGet(a, "dataServico") ||
    safeGet(a, "data");

  const hora =
    safeGet(a, "hora_servico") ||
    safeGet(a, "horaServico") ||
    safeGet(a, "hora");

  const tipoNome =
    safeGet(a, "tipo_nome") ||
    safeGet(a, "tipoNome") ||
    safeGet(a, "nome_tipo");

  const endereco = safeGet(a, "endereco");

  return {
    id: a.id,
    status: safeGet(a, "status") || "",
    tipo_nome: tipoNome || null,
    data_servico: data || null,
    hora_servico: hora || null,
    endereco: endereco || "",
  };
}

// ---------------------------------------------------------------------
// GET /api/agendamentos/cliente
// (por enquanto, todos os agendamentos)
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// GET /api/agendamentos/prestador
// (por enquanto, todos os agendamentos)
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// GET /api/agendamentos/disponiveis
// Usa a tabela ServicoDisponivel como fonte base
// ---------------------------------------------------------------------
export async function getAgendamentosDisponiveis(_req, res) {
  try {
    if (!ServicoDisponivel) {
      return res.json([]);
    }

    const registros = await ServicoDisponivel.findAll({
      order: [["id", "ASC"]],
    });

    const resposta = registros.map((s) => {
      const base = mapAgendamentoDto(s);
      return {
        ...base,
        // depois podemos incluir mais campos específicos do serviço
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

// ---------------------------------------------------------------------
// POST /api/agendamentos/:id/aceitar
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// POST /api/agendamentos/:id/recusar
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// GET /api/agendamentos/:id/qrcode
// (versão simples / placeholder – depois colocamos a lógica real)
// ---------------------------------------------------------------------
export async function qrcode(req, res) {
  try {
    const { id } = req.params;

    const ag = await Agendamento.findByPk(id);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    // Aqui no futuro podemos gerar um QR code de verdade.
    // Por enquanto devolvemos um payload simples para teste.
    return res.json({
      agendamentoId: ag.id,
      status: ag.status,
      message: "Endpoint de QRCode em desenvolvimento.",
    });
  } catch (err) {
    console.error("❌ Erro ao gerar QRCode:", err);
    return res
      .status(500)
      .json({ error: "Erro ao gerar QRCode do agendamento." });
  }
}

// ---------------------------------------------------------------------
// POST /api/agendamentos/:id/scan
// (versão simples / placeholder)
// ---------------------------------------------------------------------
export async function scan(req, res) {
  try {
    const { id } = req.params;

    const ag = await Agendamento.findByPk(id);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    // Exemplo: marcar que o QR foi escaneado (check-in/check-out)
    // Por enquanto só retornamos uma mensagem.
    return res.json({
      agendamentoId: ag.id,
      status: ag.status,
      message: "Scan de QRCode recebido (lógica em desenvolvimento).",
    });
  } catch (err) {
    console.error("❌ Erro ao processar scan de QRCode:", err);
    return res
      .status(500)
      .json({ error: "Erro ao processar scan de QRCode." });
  }
}

// ---------------------------------------------------------------------
// Export default (para compatibilidade)
// ---------------------------------------------------------------------
export default {
  getAgendamentosCliente,
  getAgendamentosPrestador,
  getAgendamentosDisponiveis,
  aceitarAgendamento,
  recusarAgendamento,
  qrcode,
  scan,
};
