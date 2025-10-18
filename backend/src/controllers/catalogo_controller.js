const { TipoServico } = require('../models');

exports.listTipos = async (req, res) => {
  try {
    const itens = await TipoServico.findAll({
      attributes: ['id', 'nomeServico'],
      order: [['nomeServico', 'ASC']], // 👈 use o atributo (mapeado ao campo)
    });
    return res.json(itens);
  } catch (err) {
    console.error('❌ listTipos:', err);
    return res.status(500).json({ error: 'Erro ao listar tipos de serviço.' });
  }
};
