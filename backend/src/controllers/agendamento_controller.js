// src/controllers/agendamento_controller.js
import {
  Agendamento,
  Contratante,
  Prestador,
  TipoServico,
  Avaliacao,
  Usuario,
} from "../models/index.js";

/**
 * Recupera o id do usuário autenticado independente
 * de como o middleware de auth populou o request.
 */
function getUsuarioId(req) {
  return (
    req.userId ||
    req.usuarioId ||
    (req.user && req.user.id) ||
    (req.auth && req.auth.id) ||
    null
  );
}

/**
 * GET /api/agendamentos/cliente
 * Lista agendamentos do contratante logado (para o front mostrar "Meus agendamentos").
 */
export async function listarAgendamentosCliente(req, res) {
  try {
    const usuarioId = getUsuarioId(req);
    if (!usuarioId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const contratante = await Contratante.findOne({
      where: { usuario_id: usuarioId },
    });

    if (!contratante) {
      return res
        .status(403)
        .json({ error: "Perfil de contratante não encontrado." });
    }

    const agendamentos = await Agendamento.findAll({
      where: { contratante_id: contratante.id },
      include: [
        {
          model: TipoServico,
          as: "tipo", // <<< certifique-se que o model Agendamento usa 'as: "tipo"' na associação
          attributes: ["nome"],
        },
        {
          model: Avaliacao,
          as: "avaliacao",
          attributes: ["nota", "comentario"],
          required: false,
        },
      ],
      order: [
        ["data_servico", "DESC"],
        ["hora_servico", "DESC"],
      ],
    });

    const resposta = agendamentos.map((ag) => ({
      id: ag.id,
      status: ag.status,
      tipo_nome: ag.tipo ? ag.tipo.nome : null,
      data_servico: ag.data_servico,
      hora_servico: ag.hora_servico,
      endereco: ag.endereco,
      avaliacao: ag.avaliacao
        ? {
            nota: ag.avaliacao.nota,
            comentario: ag.avaliacao.comentario,
          }
        : null,
    }));

    return res.json(resposta);
  } catch (err) {
    console.error("❌ Erro ao listar agendamentos do cliente:", err);
    return res
      .status(500)
      .json({ error: "Erro ao buscar agendamentos do contratante." });
  }
}

/**
 * GET /api/agendamentos/prestador
 * Lista agendamentos já aceitos pelo prestador logado.
 */
export async function listarAgendamentosPrestador(req, res) {
  try {
    const usuarioId = getUsuarioId(req);
    if (!usuarioId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const prestador = await Prestador.findOne({
      where: { usuario_id: usuarioId },
    });

    if (!prestador) {
      return res
        .status(403)
        .json({ error: "Perfil de prestador não encontrado." });
    }

    const agendamentos = await Agendamento.findAll({
      where: { prestador_id: prestador.id },
      include: [
        {
          model: TipoServico,
          as: "tipo",
          attributes: ["nome"],
        },
        {
          model: Avaliacao,
          as: "avaliacao",
          attributes: ["nota", "comentario"],
          required: false,
        },
      ],
      order: [
        ["data_servico", "DESC"],
        ["hora_servico", "DESC"],
      ],
    });

    const resposta = agendamentos.map((ag) => ({
      id: ag.id,
      status: ag.status,
      tipo_nome: ag.tipo ? ag.tipo.nome : null,
      data_servico: ag.data_servico,
      hora_servico: ag.hora_servico,
      endereco: ag.endereco,
      avaliacao: ag.avaliacao
        ? {
            nota: ag.avaliacao.nota,
            comentario: ag.avaliacao.comentario,
          }
        : null,
    }));

    return res.json(resposta);
  } catch (err) {
    console.error("❌ Erro ao listar agendamentos do prestador:", err);
    return res
      .status(500)
      .json({ error: "Erro ao buscar agendamentos do prestador." });
  }
}

/**
 * GET /api/agendamentos/disponiveis
 * Lista serviços ainda sem prestador (para os cards "Serviços disponíveis para você").
 */
export async function listarAgendamentosDisponiveis(req, res) {
  try {
    const usuarioId = getUsuarioId(req);
    if (!usuarioId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const prestador = await Prestador.findOne({
      where: { usuario_id: usuarioId },
    });

    if (!prestador) {
      return res
        .status(403)
        .json({ error: "Perfil de prestador não encontrado." });
    }

    const agendamentos = await Agendamento.findAll({
      where: {
        // serviços ainda não “pegos” por nenhum prestador
        prestador_id: null,
      },
      include: [
        {
          model: TipoServico,
          as: "tipo",
          attributes: ["nome"],
        },
        {
          model: Contratante,
          as: "contratante",
          attributes: ["id"],
          include: [
            {
              model: Usuario,
              as: "usuario",
              attributes: ["nome"],
            },
          ],
        },
      ],
      order: [
        ["data_servico", "ASC"],
        ["hora_servico", "ASC"],
      ],
    });

    const resposta = agendamentos.map((ag) => ({
      id: ag.id,
      status: ag.status,
      tipo_nome: ag.tipo ? ag.tipo.nome : null,
      data_servico: ag.data_servico,
      hora_servico: ag.hora_servico,
      endereco: ag.endereco,
      contratante_nome: ag.contratante?.usuario?.nome || null,
    }));

    return res.json(resposta);
  } catch (err) {
    console.error("❌ Erro ao listar agendamentos disponíveis:", err);
    return res
      .status(500)
      .json({ error: "Erro ao buscar serviços disponíveis." });
  }
}

/**
 * POST /api/agendamentos/:id/aceitar
 * Prestador aceita um serviço disponível.
 */
export async function aceitarAgendamento(req, res) {
  try {
    const usuarioId = getUsuarioId(req);
    if (!usuarioId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const prestador = await Prestador.findOne({
      where: { usuario_id: usuarioId },
    });

    if (!prestador) {
      return res
        .status(403)
        .json({ error: "Perfil de prestador não encontrado." });
    }

    const { id } = req.params;
    const agendamento = await Agendamento.findByPk(id);

    if (!agendamento) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    // se já tem prestador e não é o atual, não pode aceitar
    if (agendamento.prestador_id && agendamento.prestador_id !== prestador.id) {
      return res.status(409).json({
        error: "Este serviço já foi aceito por outro prestador.",
      });
    }

    agendamento.prestador_id = prestador.id;
    agendamento.status = "Aceita";
    await agendamento.save();

    return res.json({
      message: "Serviço aceito com sucesso.",
      agendamento,
    });
  } catch (err) {
    console.error("❌ Erro ao aceitar agendamento:", err);
    return res.status(500).json({ error: "Erro ao aceitar agendamento." });
  }
}

/**
 * POST /api/agendamentos/:id/recusar
 * Prestador recusa um serviço disponível.
 * Aqui apenas marcamos como "Recusada" e continuamos sem prestador.
 */
export async function recusarAgendamento(req, res) {
  try {
    const usuarioId = getUsuarioId(req);
    if (!usuarioId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const prestador = await Prestador.findOne({
      where: { usuario_id: usuarioId },
    });

    if (!prestador) {
      return res
        .status(403)
        .json({ error: "Perfil de prestador não encontrado." });
    }

    const { id } = req.params;
    const agendamento = await Agendamento.findByPk(id);

    if (!agendamento) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    // por enquanto só atualiza o status; ajuste a regra conforme sua necessidade
    agendamento.status = "Recusada";
    await agendamento.save();

    return res.json({
      message: "Serviço recusado com sucesso.",
      agendamento,
    });
  } catch (err) {
    console.error("❌ Erro ao recusar agendamento:", err);
    return res.status(500).json({ error: "Erro ao recusar agendamento." });
  }
}

// Export default para quem preferir importar tudo como objeto
export default {
  listarAgendamentosCliente,
  listarAgendamentosPrestador,
  listarAgendamentosDisponiveis,
  aceitarAgendamento,
  recusarAgendamento,
};
