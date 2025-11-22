// src/controllers/agendamento_controller.js
import db from "../models/index.js";

const { Agendamento, Contratante, Prestador } = db;

/**
 * Helper genérico para tentar ler um campo com vários nomes possíveis.
 * Se não achar, devolve null.
 */
function getField(instance, ...names) {
  if (!instance) return null;

  const json = typeof instance.toJSON === "function" ? instance.toJSON() : instance;

  for (const name of names) {
    if (json && Object.prototype.hasOwnProperty.call(json, name) && json[name] != null) {
      return json[name];
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
export async function listCliente(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    let contratante = null;
    try {
      contratante = await Contratante.findOne({ where: { usuario_id: userId } });
    } catch (e) {
      console.warn("⚠️ Não foi possível carregar Contratante:", e?.message);
    }

    const registros = await Agendamento.findAll({
      order: [["id", "ASC"]],
    });

    const filtrados = registros.filter((a) => {
      // 1) se a tabela tiver coluna de contratante/cliente, usa ela
      const cid = getField(a, "contratante_id", "cliente_id", "contratanteId", "clienteId");
      if (contratante && cid != null) {
        return Number(cid) === Number(contratante.id);
      }

      // 2) fallback: usa o usuário dono do agendamento
      const uid = getField(a, "usuario_id", "user_id", "usuarioId", "userId");
      if (uid != null) {
        return Number(uid) === Number(userId);
      }

      return false;
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
   - Lista agendamentos "Aceitos" (e similares)
   - Se houver coluna prestador_id, filtra por ela
   - Se não houver, mostra todos aceitos (comportamento antigo)
========================================================== */
export async function listPrestador(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    let prestador = null;
    try {
      prestador = await Prestador.findOne({ where: { usuario_id: userId } });
    } catch (e) {
      console.warn("⚠️ Não foi possível carregar Prestador:", e?.message);
    }

    const registros = await Agendamento.findAll({
      order: [["id", "DESC"]], // mais recente primeiro
    });

    const filtrados = registros.filter((a) => {
      const status = (getField(a, "status") || "").toLowerCase();

      const ehAceito =
        status.startsWith("aceit") ||
        status === "concluida" ||
        status === "concluído" ||
        status === "concluido";

      if (!ehAceito) return false;

      // Se existir coluna de prestador e estiver preenchida, filtra por ela
      const pid = getField(a, "prestador_id", "prestadorId", "id_prestador");
      if (prestador && pid != null) {
        return Number(pid) === Number(prestador.id);
      }

      // Se não tiver coluna de prestador, mantém comportamento antigo:
      // mostra todos os "Aceitos" para qualquer prestador.
      return true;
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
========================================================== */
export async function listDisponiveis(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    // só para garantir que é um prestador válido
    const prestador = await Prestador.findOne({
      where: { usuario_id: userId },
    });

    if (!prestador) {
      console.warn("⚠️ listDisponiveis chamado por usuário sem perfil de prestador.");
      // tecnicamente poderíamos retornar 403, mas para não quebrar o front, devolvemos []
      return res.json([]);
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
      if (!statusAbertos.includes(status)) return false;

      // se já tiver prestador_id preenchido, não deve aparecer como disponível
      const pid = getField(a, "prestador_id", "prestadorId", "id_prestador");
      if (pid != null) return false;

      return true;
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
export async function accept(req, res) {
  try {
    const { id } = req.params;

    const ag = await Agendamento.findByPk(id);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    const userId = req.user?.id;
    let prestador = null;
    if (userId) {
      prestador = await Prestador.findOne({ where: { usuario_id: userId } });
    }

    if (prestador) {
      // só seta prestador_id se esse campo existir de fato
      const json = ag.toJSON();
      if (
        Object.prototype.hasOwnProperty.call(json, "prestador_id") ||
        Object.prototype.hasOwnProperty.call(json, "prestadorId") ||
        Object.prototype.hasOwnProperty.call(json, "id_prestador")
      ) {
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
========================================================== */
export async function decline(req, res) {
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
   ✏️ ATUALIZAR AGENDAMENTO (CONTRATANTE)
   PUT /api/agendamentos/:id
   - por enquanto só atualiza data, hora, endereço e observação (se existir)
========================================================== */
export async function updateCliente(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const ag = await Agendamento.findByPk(id);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    // garantimos que o agendamento pertence ao usuário (via usuario_id ou contratante_id)
    const uid = getField(ag, "usuario_id", "user_id", "usuarioId", "userId");
    if (uid != null && Number(uid) !== Number(userId)) {
      return res.status(403).json({ error: "Você não pode editar este agendamento." });
    }

    const { data_servico, hora_servico, endereco, observacao } = req.body || {};

    if (data_servico !== undefined) ag.data_servico = data_servico;
    if (hora_servico !== undefined) ag.hora_servico = hora_servico;
    if (endereco !== undefined) ag.endereco = endereco;

    // se existir coluna de observação
    const json = ag.toJSON();
    if (
      Object.prototype.hasOwnProperty.call(json, "observacao") &&
      observacao !== undefined
    ) {
      ag.observacao = observacao;
    }

    // quando editar, volta para "Pendente"
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
   🗑️ EXCLUIR AGENDAMENTO (CONTRATANTE)
   DELETE /api/agendamentos/:id
========================================================== */
export async function deleteCliente(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const ag = await Agendamento.findByPk(id);
    if (!ag) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    const uid = getField(ag, "usuario_id", "user_id", "usuarioId", "userId");
    if (uid != null && Number(uid) !== Number(userId)) {
      return res.status(403).json({ error: "Você não pode excluir este agendamento." });
    }

    await ag.destroy();

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao excluir agendamento:", err);
    return res
      .status(500)
      .json({ error: "Erro ao excluir o agendamento." });
  }
}
