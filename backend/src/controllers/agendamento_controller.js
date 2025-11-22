// src/controllers/agendamento_controller.js
import db from "../models/index.js";

const { Agendamento, Contratante, Prestador, Sequelize } = db;
const { Op } = Sequelize;

/**
 * Monta o objeto no formato que o frontend espera.
 * (Se quiser, depois a gente acrescenta mais campos, tipo nome do serviço.)
 */
function mapAgendamentoDto(a) {
  if (!a) return null;

  return {
    id: a.id,
    status: a.status || "",
    // esses campos existem na sua tabela agendamentos:
    data_servico: a.data_servico || null,
    hora_servico: a.hora_servico || null,
    endereco: a.endereco || "",
    descricao: a.descricao || "",
    // se em algum momento tiver join com tipos_servico, dá pra preencher aqui:
    tipo_nome: a.tipo_nome || null,
  };
}

/**
 * Helpers pra achar o perfil do usuário logado
 */
async function findContratanteByUser(userId) {
  if (!userId) return null;
  return Contratante.findOne({ where: { usuario_id: userId } });
}

async function findPrestadorByUser(userId) {
  if (!userId) return null;
  return Prestador.findOne({ where: { usuario_id: userId } });
}

/* ==========================================================
   👤 CLIENTE (CONTRATANTE)
   GET /api/agendamentos/cliente
   - Lista apenas os agendamentos do contratante logado
========================================================== */
export async function getAgendamentosCliente(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const contratante = await findContratanteByUser(userId);

    // Se não tiver perfil de contratante, devolve lista vazia (frontend trata)
    if (!contratante) {
      console.log("⚠️ Nenhum contratante encontrado para usuário", userId);
      return res.json([]);
    }

    const registros = await Agendamento.findAll({
      where: { contratante_id: contratante.id },
      order: [
        ["data_servico", "ASC"],
        ["hora_servico", "ASC"],
      ],
    });

    return res.json(registros.map(mapAgendamentoDto));
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
   - Lista apenas os agendamentos desse prestador
   - Do mais recente para o mais antigo
========================================================== */
export async function getAgendamentosPrestador(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const prestador = await findPrestadorByUser(userId);

    if (!prestador) {
      console.log("⚠️ Nenhum prestador encontrado para usuário", userId);
      return res.json([]);
    }

    const registros = await Agendamento.findAll({
      where: { prestador_id: prestador.id },
      order: [
        ["data_servico", "DESC"],
        ["hora_servico", "DESC"],
      ],
    });

    return res.json(registros.map(mapAgendamentoDto));
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
   - Mostra apenas agendamentos:
     • com status "aberto" (pendente, aguardando, disponível…)
     • que ainda NÃO têm prestador_id
========================================================== */
export async function getAgendamentosDisponiveis(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const prestador = await findPrestadorByUser(userId);

    if (!prestador) {
      console.log("⚠️ Nenhum prestador encontrado para usuário", userId);
      return res.json([]);
    }

    const statusAbertos = [
      "aguardando",
      "aguardando confirmação",
      "disponivel",
      "disponível",
      "pendente",
    ];

    const registros = await Agendamento.findAll({
      where: {
        status: { [Op.in]: statusAbertos },
        prestador_id: { [Op.is]: null }, // só os que ainda não foram aceitos
      },
      order: [
        ["data_servico", "ASC"],
        ["hora_servico", "ASC"],
      ],
    });

    return res.json(registros.map(mapAgendamentoDto));
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
   - Marca como "aceita"
   - Grava o prestador_id do prestador logado
========================================================== */
export async function aceitarAgendamento(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const prestador = await findPrestadorByUser(userId);
    if (!prestador) {
      return res
        .status(403)
        .json({ error: "Perfil de prestador não encontrado." });
    }

    const { id } = req.params;
    const ag = await Agendamento.findByPk(id);

    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    // Se já tiver outro prestador, impede "roubar" o serviço
    if (ag.prestador_id && ag.prestador_id !== prestador.id) {
      return res.status(409).json({
        error: "Este agendamento já foi aceito por outro prestador.",
      });
    }

    ag.prestador_id = prestador.id;
    ag.status = "aceita"; // igual ao que aparece hoje na sua tabela

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
   - Marca como "recusada"
========================================================== */
export async function recusarAgendamento(req, res) {
  try {
    const { id } = req.params;

    const ag = await Agendamento.findByPk(id);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    ag.status = "recusada";
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
   - Contratante pode alterar data/hora/endereço/descrição
   - Status volta para "pendente"
========================================================== */
export async function updateAgendamento(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const contratante = await findContratanteByUser(userId);
    if (!contratante) {
      return res
        .status(403)
        .json({ error: "Perfil de contratante não encontrado." });
    }

    const { id } = req.params;
    const ag = await Agendamento.findByPk(id);

    if (!ag || ag.contratante_id !== contratante.id) {
      return res
        .status(404)
        .json({ error: "Agendamento não encontrado para este contratante." });
    }

    const {
      data_servico,
      dataServico,
      hora_servico,
      horaServico,
      duracao,
      descricao,
      endereco,
    } = req.body;

    if (data_servico || dataServico) {
      ag.data_servico = data_servico || dataServico;
    }
    if (hora_servico || horaServico) {
      ag.hora_servico = hora_servico || horaServico;
    }
    if (duracao !== undefined) {
      ag.duracao = duracao;
    }
    if (descricao !== undefined) {
      ag.descricao = descricao;
    }
    if (endereco !== undefined) {
      ag.endereco = endereco;
    }

    // sempre que editar, volta pra pendente
    ag.status = "pendente";

    await ag.save();

    return res.json(mapAgendamentoDto(ag));
  } catch (err) {
    console.error("❌ Erro ao atualizar agendamento:", err);
    return res
      .status(500)
      .json({ error: "Erro ao atualizar o agendamento." });
  }
}

/**
 * Export default pra continuar compatível com `import * as Ag` nas rotas
 */
export default {
  getAgendamentosCliente,
  getAgendamentosPrestador,
  getAgendamentosDisponiveis,
  aceitarAgendamento,
  recusarAgendamento,
  updateAgendamento,
};
