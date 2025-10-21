// backend/src/controllers/historico_controller.js
const { Agendamento, TipoServico, Prestador, Contratante, Avaliacao, Usuario } = require('../models');

/** GET /api/historico/cliente — serviços concluídos do contratante (com avaliação se houver) */
exports.historicoCliente = async (req, res) => {
  try {
    const contr = await Contratante.findOne({
      where: { usuario_id: req.user.id }, attributes: ['id']
    });
    if (!contr) return res.status(403).json({ error: 'Apenas contratantes' });

    const itens = await Agendamento.findAll({
      where: { contratanteId: contr.id, status: 'concluida' },
      include: [
        { model: TipoServico,  as: 'tipo',      attributes: ['id','nome'], required: false },
        { model: Avaliacao,    as: 'avaliacao', attributes: ['id','nota','comentario','createdAt'], required: false },
        { model: Prestador,    as: 'prestador', attributes: ['id'], required: false,
          include: [{ model: Usuario, as: 'usuario', attributes: ['nomeUsuario','email'] }]
        },
      ],
      order: [['dataServico','DESC'], ['horaServico','DESC']],
      attributes: [
        'id','tipoServicoId','descricao','dataServico','horaServico','duracaoHoras',
        'endereco','status','checkinAt','startAt','endAt'
      ],
    });

    const out = itens.map(a => ({
      id: a.id,
      tipo_servico_id: a.tipoServicoId,
      tipo_nome: a.tipo?.nome ?? null,
      data_servico: a.dataServico,
      hora_servico: a.horaServico,
      duracao_horas: a.duracaoHoras,
      endereco: a.endereco,
      descricao: a.descricao,
      prestador_id: a.prestadorId ?? a.prestador?.id ?? null,
      prestador_nome: a.prestador?.usuario?.nomeUsuario ?? null,
      prestador_email: a.prestador?.usuario?.email ?? null,
      checkin_at: a.checkinAt ?? null,
      start_at:   a.startAt   ?? null,
      end_at:     a.endAt     ?? null,
      avaliacao: a.avaliacao ? {
        id: a.avaliacao.id,
        nota: a.avaliacao.nota,
        comentario: a.avaliacao.comentario,
        created_at: a.avaliacao.createdAt,
      } : null,
    }));

    return res.json(out);
  } catch (e) {
    console.error('❌ historicoCliente:', e);
    return res.status(500).json({ error: 'Erro ao carregar histórico' });
  }
};

/** (opcional) mover pra cá também: status do agendamento do cliente */
exports.statusCliente = async (req, res) => {
  try {
    const agId = Number(req.params.id);
    if (!agId) return res.status(400).json({ error: 'ID inválido' });

    const contr = await Contratante.findOne({ where: { usuario_id: req.user.id }, attributes: ['id'] });
    if (!contr) return res.status(403).json({ error: 'Apenas contratantes' });

    const ag = await Agendamento.findByPk(agId, {
      attributes: ['id','contratanteId','prestadorId','status','checkinAt','startAt','endAt']
    });
    if (!ag) return res.status(404).json({ error: 'Agendamento não encontrado' });
    if (ag.contratanteId !== contr.id) {
      return res.status(403).json({ error: 'Este agendamento não pertence a você' });
    }

    const avaliacao = await Avaliacao.findOne({
      where: { agendamentoId: ag.id, clienteId: contr.id }, attributes: ['id']
    });

    return res.json({
      id: ag.id,
      status: ag.status,
      checkinAt: ag.checkinAt,
      startAt: ag.startAt,
      endAt: ag.endAt,
      avaliado: !!avaliacao,
    });
  } catch (e) {
    console.error('❌ statusCliente:', e);
    return res.status(500).json({ error: 'Erro ao consultar status' });
  }
};
