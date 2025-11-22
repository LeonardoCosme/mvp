// src/controllers/agendamento_controller.js
import db from "../models/index.js";

const { Agendamento, Contratante, Prestador } = db;

/**
 * Lê um campo tentando vários nomes possíveis.
 * Ex.: getField(a, "contratante_id", "id_contratante")
 */
function getField(instance, ...names) {
  if (!instance) return null;

  for (const name of names) {
    // acesso direto: a.campo
    if (Object.prototype.hasOwnProperty.call(instance, name)) {
      const v = instance[name];
      if (v !== undefined && v !== null) return v;
    }

    // via Sequelize: a.get("campo")
    if (typeof instance.get === "function") {
      const v = instance.get(name);
      if (v !== undefined && v !== null) return v;
    }
  }

  return null;
}

/**
 * Seta um campo tentando vários nomes de propriedade.
 */
function setField(instance, names, value) {
  if (!instance) return;

  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(instance, name)) {
      instance[name] = value;
      return;
    }
  }

  if (typeof instance.set === "function") {
    for (const name of names) {
      try {
        instance.set(name, value);
        return;
      } catch {
        // ignora e tenta o próximo nome
      }
    }
  }
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
   👤 CLIENTE (CONTRATANTE)
   GET /api/agendamentos/cliente
   - Lista APENAS agendamentos do contratante logado
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
      const cid =
        getField(a, "contratante_id", "contratanteId", "id_contratante", "cliente_id");
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
   - Lista APENAS agendamentos desse prestador
   - Ordena do mais recente para o mais antigo
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

    const registros = await Agendamento.findAll();

    const filtrados = registros.filter((a) => {
      const pid = getField(
        a,
        "prestador_id",
        "prestadorId",
        "id_prestador",
        "idPrestador"
      );
      return pid === prestador.id;
    });

    // ordena por data + hora (desc). Se não tiver, cai para id desc.
    filtrados.sort((a, b) => {
      const da = getField(a, "data_servico", "dataServico", "data") || "";
      const db_ = getField(b, "data_servico", "dataServico", "data") || "";
      const ha = getField(a, "hora_servico", "horaServico", "hora") || "";
      const hb = getField(b, "hora_servico", "horaServico", "hora") || "";

      const keyA = `${da} ${ha}`;
      const keyB = `${db_} ${hb}`;

      if (keyA === " ") return -1;
      if (keyB === " ") return 1;
      if (keyA < keyB) return 1;
      if (keyA > keyB) return -1;

      // fallback
      return (b.id || 0) - (a.id || 0);
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
   - Mostra só agendamentos com status “aberto”
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

      // se já tiver prestador vinculado, não é mais “disponível”
      const pid = getField(
        a,
        "prestador_id",
        "prestadorId",
        "id_prestador",
        "idPrestador"
      );

      return statusAbertos.includes(status) && (pid === null || pid === undefined);
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
        setField(
          ag,
          ["prestador_id", "prestadorId", "id_prestador", "idPrestador"],
          prestador.id
        );
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

    // opcional: liberar de novo o prestador, se estava vinculado
    setField(
      ag,
      ["prestador_id", "prestadorId", "id_prestador", "idPrestador"],
      null
    );

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
   ✏️ ATUALIZAR AGENDAMENTO (CONTRATANTE)
   PUT /api/agendamentos/:id
   - Só o contratante dono pode editar
   - Campos típicos: data, hora, endereço, observação
   - Após edição, status volta para "Pendente"
========================================================== */
export async function atualizarAgendamentoCliente(req, res) {
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

    const cid = getField(
      ag,
      "contratante_id",
      "contratanteId",
      "id_contratante",
      "cliente_id"
    );
    if (cid !== contratante.id) {
      return res
        .status(403)
        .json({ error: "Você não pode editar este agendamento." });
    }

    const {
      data_servico,
      dataServico,
      data,
      hora_servico,
      horaServico,
      hora,
      endereco,
      observacao,
    } = req.body || {};

    const novaData = data_servico || dataServico || data;
    const novaHora = hora_servico || horaServico || hora;

    if (novaData) {
      setField(ag, ["data_servico", "dataServico", "data"], novaData);
    }
    if (novaHora) {
      setField(ag, ["hora_servico", "horaServico", "hora"], novaHora);
    }
    if (endereco) {
      setField(ag, ["endereco"], endereco);
    }
    if (observacao) {
      setField(ag, ["observacao", "obs"], observacao);
    }

    // depois de editar, volta para pendente/aguardando
    ag.status = "Pendente";

    await ag.save();

    return res.json(mapAgendamentoDto(ag));
  } catch (err) {
    console.error("❌ Erro ao atualizar agendamento:", err);
    return res
      .status(500)
      .json({ error: "Erro ao atualizar o agendamento." });
  }
}

/* ==========================================================
   ✅ Export default (para compatibilidade)
========================================================== */
export default {
  getAgendamentosCliente,
  getAgendamentosPrestador,
  getAgendamentosDisponiveis,
  aceitarAgendamento,
  recusarAgendamento,
  atualizarAgendamentoCliente,
};
