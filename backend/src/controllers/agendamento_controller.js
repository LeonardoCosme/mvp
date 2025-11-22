// src/controllers/agendamento_controller.js
import db from "../models/index.js";

const { Agendamento, Contratante, Prestador } = db;

/* ==========================================================
   🔧 Helpers
========================================================== */

// Lê um campo tentando vários nomes possíveis
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

// Converte um registro do banco para o formato que o front espera
function toDto(a) {
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
   👤 CONTRATANTE – MEUS AGENDAMENTOS
   GET /api/agendamentos/cliente
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
      console.log("DEBUG listCliente: nenhum contratante para usuario", userId);
      return res
        .status(403)
        .json({ error: "Perfil de contratante não encontrado." });
    }

    const registros = await Agendamento.findAll({
      where: { contratante_id: contratante.id },
      order: [
        ["data_servico", "DESC"],
        ["hora_servico", "DESC"],
      ],
    });

    console.log(
      `DEBUG listCliente: usuario=${userId}, contratante=${contratante.id}, registros=${registros.length}`
    );

    return res.json(registros.map(toDto));
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
      console.log("DEBUG listPrestador: nenhum prestador para usuario", userId);
      return res
        .status(403)
        .json({ error: "Perfil de prestador não encontrado." });
    }

    const registros = await Agendamento.findAll({
      where: { prestador_id: prestador.id },
      order: [
        ["data_servico", "DESC"],
        ["hora_servico", "DESC"],
      ],
    });

    console.log(
      `DEBUG listPrestador: usuario=${userId}, prestador=${prestador.id}, registros=${registros.length}`
    );

    return res.json(registros.map(toDto));
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
   - Mostra apenas agendamentos em status "aberto"
   - (pendente/aguardando/disponível) e SEM prestador_id
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
      console.log("DEBUG listDisponiveis: nenhum prestador para usuario", userId);
      return res
        .status(403)
        .json({ error: "Perfil de prestador não encontrado." });
    }

    const registros = await Agendamento.findAll({
      where: { prestador_id: null },
      order: [
        ["data_servico", "ASC"],
        ["hora_servico", "ASC"],
      ],
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

    console.log(
      `DEBUG listDisponiveis: usuario=${userId}, prestador=${prestador.id}, total=${registros.length}, abertos=${filtrados.length}`
    );

    return res.json(filtrados.map(toDto));
  } catch (err) {
    console.error("❌ Erro ao listar serviços disponíveis:", err);
    return res
      .status(500)
      .json({ error: "Erro ao listar serviços disponíveis." });
  }
}

/* ==========================================================
   ➕ CRIAR AGENDAMENTO (CONTRATANTE)
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

    const {
      tipo_servico_id,
      descricao,
      data_servico,
      hora_servico,
      duracao,
      endereco,
    } = req.body;

    const novo = await Agendamento.create({
      contratante_id: contratante.id,
      prestador_id: null,
      tipo_servico_id,
      descricao,
      data_servico,
      hora_servico,
      duracao,
      endereco,
      status: "pendente",
    });

    console.log(
      `DEBUG create: usuario=${userId}, contratante=${contratante.id}, agendamento=${novo.id}`
    );

    return res.status(201).json(toDto(novo));
  } catch (err) {
    console.error("❌ Erro ao criar agendamento:", err);
    return res.status(500).json({ error: "Erro ao criar agendamento." });
  }
}

/* ==========================================================
   ✏️ EDITAR AGENDAMENTO (CONTRATANTE)
   PUT /api/agendamentos/:id
========================================================== */
export async function update(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const contratante = await Contratante.findOne({
      where: { usuario_id: userId },
    });

    if (!contratante) {
      return res
        .status(403)
        .json({ error: "Perfil de contratante não encontrado." });
    }

    const ag = await Agendamento.findByPk(id);
    if (!ag || ag.contratante_id !== contratante.id) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    // Se já está aceito/concluído, não deixa editar
    const statusAtual = (ag.status || "").toLowerCase().trim();
    if (["aceita", "aceito", "concluida", "concluída"].includes(statusAtual)) {
      return res
        .status(400)
        .json({ error: "Não é possível editar um agendamento já aceito." });
    }

    const {
      descricao,
      data_servico,
      hora_servico,
      duracao,
      endereco,
    } = req.body;

    if (descricao !== undefined) ag.descricao = descricao;
    if (data_servico !== undefined) ag.data_servico = data_servico;
    if (hora_servico !== undefined) ag.hora_servico = hora_servico;
    if (duracao !== undefined) ag.duracao = duracao;
    if (endereco !== undefined) ag.endereco = endereco;

    // sempre volta a ser pendente após edição
    ag.status = "pendente";

    await ag.save();

    console.log(
      `DEBUG update: usuario=${userId}, contratante=${contratante.id}, agendamento=${ag.id}`
    );

    return res.json(toDto(ag));
  } catch (err) {
    console.error("❌ Erro ao editar agendamento:", err);
    return res.status(500).json({ error: "Erro ao editar agendamento." });
  }
}

/* ==========================================================
   🗑️ EXCLUIR AGENDAMENTO (CONTRATANTE)
   DELETE /api/agendamentos/:id
========================================================== */
export async function remove(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const contratante = await Contratante.findOne({
      where: { usuario_id: userId },
    });

    if (!contratante) {
      return res
        .status(403)
        .json({ error: "Perfil de contratante não encontrado." });
    }

    const ag = await Agendamento.findByPk(id);
    if (!ag || ag.contratante_id !== contratante.id) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    await ag.destroy();

    console.log(
      `DEBUG remove: usuario=${userId}, contratante=${contratante.id}, agendamento=${id}`
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao remover agendamento:", err);
    return res.status(500).json({ error: "Erro ao remover agendamento." });
  }
}

/* ==========================================================
   ✅ ACEITAR (PRESTADOR)
   POST /api/agendamentos/:id/aceitar
========================================================== */
export async function accept(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

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

    // só deixa aceitar se ainda estiver aberto
    const statusAtual = (ag.status || "").toLowerCase().trim();
    if (!["pendente", "aguardando", "disponivel", "disponível"].includes(statusAtual)) {
      return res.status(400).json({ error: "Agendamento já não está disponível." });
    }

    ag.prestador_id = prestador.id;
    ag.status = "aceita";

    await ag.save();

    console.log(
      `DEBUG accept: usuario=${userId}, prestador=${prestador.id}, agendamento=${ag.id}`
    );

    return res.json(toDto(ag));
  } catch (err) {
    console.error("❌ Erro ao aceitar agendamento:", err);
    return res.status(500).json({ error: "Erro ao aceitar o agendamento." });
  }
}

/* ==========================================================
   ❌ RECUSAR (PRESTADOR)
   POST /api/agendamentos/:id/recusar
========================================================== */
export async function recusar(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

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

    ag.status = "recusada";
    await ag.save();

    console.log(
      `DEBUG recusar: usuario=${userId}, prestador=${prestador.id}, agendamento=${ag.id}`
    );

    return res.json(toDto(ag));
  } catch (err) {
    console.error("❌ Erro ao recusar agendamento:", err);
    return res.status(500).json({ error: "Erro ao recusar o agendamento." });
  }
}

/* ==========================================================
   🔳 QR CODE (placeholders por enquanto)
========================================================== */
export async function qrcode(_req, res) {
  return res
    .status(501)
    .json({ error: "Funcionalidade de QR Code ainda não implementada." });
}

export async function scan(_req, res) {
  return res
    .status(501)
    .json({ error: "Funcionalidade de leitura de QR Code ainda não implementada." });
}

/* ==========================================================
   🔁 Export default para quem ainda usa import default
========================================================== */
export default {
  create,
  listCliente,
  listPrestador,
  listDisponiveis,
  update,
  remove,
  accept,
  recusar,
  qrcode,
  scan,
};
