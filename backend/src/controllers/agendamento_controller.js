// backend/src/controllers/agendamento_controller.js
const crypto = require('node:crypto');
const { Op, Sequelize } = require('sequelize');
const {
  Agendamento,
  TipoServico,
  Prestador,
  Contratante,
  Avaliacao,
  Usuario, // 👈 precisamos disso para pegar nome/email do prestador
} = require('../models');

/** Util: token randômico p/ QR */
function genToken() {
  return crypto.randomBytes(16).toString('hex');
}

/** Normaliza payload do POST /agendamentos */
function normalizeCreate(body = {}) {
  const out = {
    tipo_servico_id: Number(body.tipo_servico_id),
    data: String(body.data || '').trim(),    // YYYY-MM-DD
    hora: String(body.hora || '').trim(),    // HH:MM(:SS)
    endereco: body.endereco ? String(body.endereco).trim() : null,
    descricao: body.descricao ? String(body.descricao).trim() : null,
    duracao_horas:
      body.duracao_horas != null
        ? Number(String(body.duracao_horas).replace(',', '.'))
        : null,
  };
  if (out.hora && out.hora.length === 5) out.hora = `${out.hora}:00`;
  return out;
}
function isISODate(d) { return /^\d{4}-\d{2}-\d{2}$/.test(String(d||'')); }
function isTime(h)    { return /^\d{2}:\d{2}(:\d{2})?$/.test(String(h||'')); }

/** POST /api/agendamentos — cria agendamento (status: pendente) */
exports.create = async (req, res) => {
  try {
    const userId = req.user.id;
    const payload = normalizeCreate(req.body);

    if (!payload.tipo_servico_id)
      return res.status(400).json({ error: 'tipo_servico_id é obrigatório.' });
    if (!payload.data || !isISODate(payload.data))
      return res.status(400).json({ error: 'Data inválida. Use YYYY-MM-DD.' });
    if (!payload.hora || !isTime(payload.hora))
      return res.status(400).json({ error: 'Hora inválida. Use HH:MM ou HH:MM:SS.' });
    if (!payload.endereco)
      return res.status(400).json({ error: 'Endereço é obrigatório.' });

    const tipo = await TipoServico.findByPk(payload.tipo_servico_id, { attributes: ['id'] });
    if (!tipo) return res.status(404).json({ error: 'Tipo de serviço não encontrado.' });

    const contr = await Contratante.findOne({ where: { usuario_id: userId }, attributes: ['id'] });
    if (!contr) return res.status(403).json({ error: 'Perfil de contratante não encontrado.' });

    const novo = await Agendamento.create({
      contratanteId: contr.id,
      prestadorId: null,
      tipoServicoId: payload.tipo_servico_id,
      descricao: payload.descricao || null,
      dataServico: payload.data,
      horaServico: payload.hora,
      duracaoHoras: payload.duracao_horas ?? null,
      endereco: payload.endereco,
      status: 'pendente',
    });

    return res.status(201).json({
      id: novo.id,
      prestador_id: novo.prestadorId,
      contratante_id: novo.contratanteId,
      tipo_servico_id: novo.tipoServicoId,
      descricao: novo.descricao,
      data_servico: novo.dataServico,
      hora_servico: novo.horaServico,
      duracao_horas: novo.duracaoHoras,
      endereco: novo.endereco,
      status: novo.status,
      created_at: novo.createdAt,
    });
  } catch (err) {
    console.error('❌ Agendamento.create:', err);
    return res.status(500).json({ error: 'Erro ao criar agendamento.' });
  }
};

/** GET /api/agendamentos/cliente — lista do contratante logado */
exports.listCliente = async (req, res) => {
  try {
    const userId = req.user.id;

    const contr = await Contratante.findOne({
      where: { usuario_id: userId },
      attributes: ['id'],
    });
    if (!contr) {
      return res.status(403).json({ error: 'Perfil de contratante não encontrado.' });
    }

    const itens = await Agendamento.findAll({
      where: { contratanteId: contr.id },
      include: [
        {
          model: TipoServico,
          as: 'tipo',
          attributes: ['id', 'nome'],
          required: false,
        },
      ],
      order: [
        [Sequelize.col('Agendamento.data_servico'), 'ASC'],
        [Sequelize.col('Agendamento.hora_servico'), 'ASC'],
      ],
    });

    const out = itens.map((a) => ({
      id: a.id,
      prestador_id: a.prestadorId,
      contratante_id: a.contratanteId,
      tipo_servico_id: a.tipoServicoId,
      descricao: a.descricao,
      data_servico: a.dataServico,
      hora_servico: a.horaServico,
      duracao_horas: a.duracaoHoras,
      endereco: a.endereco,
      status: a.status,
      created_at: a.createdAt,
      tipo_nome: a.tipo?.nome ?? null,

      checkin_at: a.checkinAt ?? null,
      start_at:   a.startAt   ?? null,
      end_at:     a.endAt     ?? null,
      checkin_used: a.checkinUsed ?? 0,
      start_used:   a.startUsed   ?? 0,
      end_used:     a.endUsed     ?? 0,
    }));

    return res.json(out);
  } catch (err) {
    console.error('❌ Agendamento.listCliente:', err);
    return res.status(500).json({ error: 'Erro ao listar agendamentos do cliente.' });
  }
};

/** GET /api/agendamentos/pendentes — lista para prestador (ainda não aceitos) */
exports.listPrestadorPendentes = async (req, res) => {
  try {
    if (req.user?.tipo !== 'prestador') {
      return res.status(403).json({ error: 'Apenas prestadores.' });
    }

    const itens = await Agendamento.findAll({
      where: { status: 'pendente' },
      include: [
        {
          model: TipoServico,
          as: 'tipo',
          attributes: ['id', 'nome'],
          required: false,
        },
      ],
      order: [
        [Sequelize.col('Agendamento.data_servico'), 'ASC'],
        [Sequelize.col('Agendamento.hora_servico'), 'ASC'],
      ],
    });

    const out = itens.map((a) => ({
      id: a.id,
      prestador_id: a.prestadorId,
      contratante_id: a.contratanteId,
      tipo_servico_id: a.tipoServicoId,
      descricao: a.descricao,
      data_servico: a.dataServico,
      hora_servico: a.horaServico,
      duracao_horas: a.duracaoHoras,
      endereco: a.endereco,
      status: a.status,
      created_at: a.createdAt,
      tipo_nome: a.tipo?.nome ?? null,
    }));

    return res.json(out);
  } catch (err) {
    console.error('❌ Agendamento.listPrestadorPendentes:', err);
    return res.status(500).json({ error: 'Erro ao listar agendamentos pendentes.' });
  }
};

/** GET /api/agendamentos/prestador — lista aceita/concluída do prestador logado */
exports.listPrestador = async (req, res) => {
  try {
    if (req.user?.tipo !== 'prestador') {
      return res.status(403).json({ error: 'Apenas prestadores.' });
    }

    const prest = await Prestador.findOne({
      where: { usuario_id: req.user.id },
      attributes: ['id'],
    });
    if (!prest) {
      return res.status(403).json({ error: 'Perfil de prestador não encontrado.' });
    }

    const itens = await Agendamento.findAll({
      where: {
        prestadorId: prest.id,
        status: { [Op.in]: ['aceita', 'concluida'] },
      },
      include: [
        {
          model: TipoServico,
          as: 'tipo',
          attributes: ['id', 'nome'],
          required: false,
        },
      ],
      order: [
        [Sequelize.col('Agendamento.data_servico'), 'ASC'],
        [Sequelize.col('Agendamento.hora_servico'), 'ASC'],
      ],
    });

    const out = itens.map((a) => ({
      id: a.id,
      prestador_id: a.prestadorId,
      contratante_id: a.contratanteId,
      tipo_servico_id: a.tipoServicoId,
      descricao: a.descricao,
      data_servico: a.dataServico,
      hora_servico: a.horaServico,
      duracao_horas: a.duracaoHoras,
      endereco: a.endereco,
      status: a.status,
      created_at: a.createdAt,
      tipo_nome: a.tipo?.nome ?? null,

      checkin_at: a.checkinAt ?? null,
      start_at:   a.startAt   ?? null,
      end_at:     a.endAt     ?? null,
      checkin_used: a.checkinUsed ?? 0,
      start_used:   a.startUsed   ?? 0,
      end_used:     a.endUsed     ?? 0,
    }));

    return res.json(out);
  } catch (err) {
    console.error('❌ Agendamento.listPrestador:', err);
    return res.status(500).json({ error: 'Erro ao listar agendamentos do prestador.' });
  }
};

/** POST /api/agendamentos/:id/aceitar — prestador aceita um pendente */
exports.accept = async (req, res) => {
  try {
    if (req.user?.tipo !== 'prestador') {
      return res.status(403).json({ error: 'Apenas prestadores podem aceitar.' });
    }

    const usuarioId = req.user.id;
    const agId = Number(req.params.id);
    if (!agId) return res.status(400).json({ error: 'ID inválido.' });

    const prest = await Prestador.findOne({
      where: { usuario_id: usuarioId },
      attributes: ['id', 'usuario_id'],
    });
    if (!prest) {
      return res.status(409).json({
        error: 'Perfil de prestador não encontrado. Complete seu cadastro de prestador antes de aceitar.',
      });
    }

    const ag = await Agendamento.findByPk(agId);
    if (!ag) return res.status(404).json({ error: 'Agendamento não encontrado.' });
    if (ag.status !== 'pendente') {
      return res.status(400).json({ error: 'Somente agendamentos pendentes podem ser aceitos.' });
    }

    const conflito = await Agendamento.findOne({
      where: {
        prestadorId: prest.id,
        dataServico: ag.dataServico,
        horaServico: ag.horaServico,
        status: { [Op.in]: ['aceita', 'concluida'] },
      },
    });
    if (conflito) {
      return res.status(409).json({ error: 'Conflito de horário para este prestador.' });
    }

    await ag.update({ status: 'aceita', prestadorId: prest.id });

    return res.json({ ok: true, id: ag.id, status: ag.status, prestador_id: ag.prestadorId });
  } catch (err) {
    console.error('❌ Agendamento.accept:', err);
    return res.status(500).json({ error: 'Erro ao aceitar agendamento.' });
  }
};

/** GET /api/agendamentos/:id/qrcode?phase=checkin|start|end */
exports.qrcode = async (req, res) => {
  try {
    const userId = req.user.id;
    const phase = String(req.query.phase || '');
    const valid = ['checkin', 'start', 'end'];
    if (!valid.includes(phase)) return res.status(400).json({ error: 'phase inválida' });

    const ag = await Agendamento.findByPk(req.params.id);
    if (!ag) return res.status(404).json({ error: 'Agendamento não encontrado' });

    const contr = await Contratante.findOne({ where: { usuario_id: userId }, attributes: ['id'] });
    if (!contr || contr.id !== ag.contratanteId) return res.status(403).json({ error: 'Acesso negado' });

    const tokenField = `${phase}Qr`;
    if (!ag[tokenField]) {
      ag[tokenField] = genToken();
      await ag.save({ fields: [tokenField] }); // salva só o campo gerado
    }

    const base = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const url = `${base}/agendamento/${ag.id}/scanner?phase=${phase}&token=${ag[tokenField]}`;

    return res.json({ id: ag.id, phase, token: ag[tokenField], url });
  } catch (err) {
    console.error('❌ Agendamento.qrcode:', err);
    return res.status(500).json({ error: 'Erro ao gerar QR' });
  }
};

/** POST /api/agendamentos/:id/scan { token, phase } */
exports.scan = async (req, res) => {
  try {
    if (req.user?.tipo !== 'prestador') {
      return res.status(403).json({ error: 'Apenas prestadores.' });
    }

    const userId = req.user.id;
    const token = String(req.body?.token || '');
    const phase = String(req.body?.phase || '');
    const valid = ['checkin', 'start', 'end'];
    if (!token || !valid.includes(phase)) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    const ag = await Agendamento.findByPk(req.params.id);
    if (!ag) return res.status(404).json({ error: 'Agendamento não encontrado' });

    const prest = await Prestador.findOne({ where: { usuario_id: userId }, attributes: ['id'] });
    if (!prest) return res.status(403).json({ error: 'Perfil de prestador não encontrado' });
    if (!ag.prestadorId || ag.prestadorId !== prest.id) {
      return res.status(403).json({ error: 'Este agendamento não está atribuído a você' });
    }

    const tokenField = `${phase}Qr`;
    const usedField  = `${phase}Used`;
    const timeField  = `${phase}At`;

    if (!ag[tokenField]) return res.status(400).json({ error: 'QR desta etapa não foi gerado' });
    if (ag[usedField])  return res.status(409).json({ error: 'QR desta etapa já utilizado' });
    if (ag[tokenField] !== token) return res.status(400).json({ error: 'Token inválido' });

    if (phase === 'start' && !ag.checkinAt) return res.status(400).json({ error: 'Faça o check-in antes do início' });
    if (phase === 'end'   && !ag.startAt)   return res.status(400).json({ error: 'Faça o início antes do término' });

    ag[usedField] = true;
    ag[timeField] = new Date();
    if (phase === 'end' && (ag.status === 'aceita' || ag.status === 'pendente')) {
      ag.status = 'concluida';
    }
    await ag.save();

    return res.json({ ok: true, id: ag.id, phase, at: ag[timeField], status: ag.status });
  } catch (err) {
    console.error('❌ Agendamento.scan:', err);
    return res.status(500).json({ error: 'Erro ao validar QR' });
  }
};

/** ✅ GET /api/agendamentos/:id/status — cliente dono (para polling abrir a avaliação) */
exports.status = async (req, res) => {
  try {
    const agId = Number(req.params.id);
    if (!agId) return res.status(400).json({ error: 'ID inválido' });

    const contr = await Contratante.findOne({
      where: { usuario_id: req.user.id },
      attributes: ['id'],
    });
    if (!contr) return res.status(403).json({ error: 'Apenas contratantes' });

    const ag = await Agendamento.findByPk(agId, {
      attributes: [
        'id','contratanteId','prestadorId','status','checkinAt','startAt','endAt','tipoServicoId'
      ],
      include: [
        { model: TipoServico, as: 'tipo', attributes: ['nome'] },
        {
          model: Prestador, as: 'prestador', attributes: ['id'],
          include: [{ model: Usuario, as: 'usuario', attributes: ['nomeUsuario','email'] }]
        }
      ],
    });
    if (!ag) return res.status(404).json({ error: 'Agendamento não encontrado' });
    if (ag.contratanteId !== contr.id) {
      return res.status(403).json({ error: 'Este agendamento não pertence a você' });
    }

    // avaliado pelo contratante dono
    const avaliacao = await Avaliacao.findOne({
      where: { agendamentoId: ag.id, clienteId: contr.id },
      attributes: ['id'],
    });

    return res.json({
      id: ag.id,
      status: ag.status, // 'pendente' | 'aceita' | 'concluida'
      checkinAt: ag.checkinAt,
      startAt: ag.startAt,
      endAt: ag.endAt,
      avaliado: !!avaliacao,

      // contexto para o modal
      tipo_servico_id: ag.tipoServicoId,
      tipo_nome: ag.tipo?.nome ?? null,
      prestador_id: ag.prestadorId ?? null,
      prestador_nome: ag.prestador?.usuario?.nomeUsuario ?? null,
      prestador_email: ag.prestador?.usuario?.email ?? null, // opcional
    });
  } catch (err) {
    console.error('❌ Agendamento.status:', err);
    return res.status(500).json({ error: 'Erro ao consultar status' });
  }
};
