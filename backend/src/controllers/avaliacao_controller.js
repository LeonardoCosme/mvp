// src/controllers/avaliacao_controller.js
const { Agendamento, Contratante, Avaliacao } = require('../models');

/** POST /api/avaliacoes { agendamentoId, nota(1..5), comentario? } */
exports.create = async (req, res) => {
  try {
    const { agendamentoId, nota, comentario } = req.body || {};
    const agId = Number(agendamentoId);
    const n = Number(nota);
    if (!agId) return res.status(400).json({ error: 'agendamentoId obrigatório' });
    if (!(n >= 1 && n <= 5)) return res.status(400).json({ error: 'nota deve ser 1..5' });

    // cliente logado
    const contr = await Contratante.findOne({
      where: { usuario_id: req.user.id }, attributes: ['id'],
    });
    if (!contr) return res.status(403).json({ error: 'Apenas contratantes' });

    // agendamento tem que ser dele e estar concluído
    const ag = await Agendamento.findByPk(agId, {
      attributes: ['id','contratanteId','prestadorId','status'],
    });
    if (!ag) return res.status(404).json({ error: 'Agendamento não encontrado' });
    if (ag.contratanteId !== contr.id) {
      return res.status(403).json({ error: 'Este agendamento não pertence a você' });
    }
    if (ag.status !== 'concluida') {
      return res.status(400).json({ error: 'Só é possível avaliar agendamento concluído' });
    }

    // impedir 2ª avaliação
    const exists = await Avaliacao.findOne({ where: { agendamentoId: ag.id }, attributes: ['id'] });
    if (exists) return res.status(409).json({ error: 'Este agendamento já foi avaliado' });

    const nova = await Avaliacao.create({
      agendamentoId: ag.id,
      clienteId: contr.id,
      prestadorId: ag.prestadorId,
      nota: n,
      comentario: comentario ? String(comentario).trim() : null,
    });

    return res.status(201).json({ ok: true, id: nova.id });
  } catch (e) {
    console.error('❌ Avaliacao.create:', e);
    return res.status(500).json({ error: 'Erro ao criar avaliação' });
  }
};

/** (Opcional) GET /api/avaliacoes/resumo/:prestadorId */
exports.resumoPrestador = async (req, res) => {
  try {
    const prestadorId = Number(req.params.prestadorId);
    if (!prestadorId) return res.status(400).json({ error: 'prestadorId inválido' });

    const rows = await Avaliacao.findAll({ where: { prestadorId }, attributes: ['nota'] });
    const total = rows.length;
    if (!total) return res.json({ media: 0, total: 0, distribuicao: {1:0,2:0,3:0,4:0,5:0} });

    const dist = {1:0,2:0,3:0,4:0,5:0};
    let soma = 0;
    rows.forEach(r => { dist[r.nota]++; soma += r.nota; });
    const media = Number((soma/total).toFixed(2));
    return res.json({ media, total, distribuicao: dist });
  } catch (e) {
    console.error('❌ Avaliacao.resumoPrestador:', e);
    return res.status(500).json({ error: 'Erro ao obter resumo' });
  }
};
