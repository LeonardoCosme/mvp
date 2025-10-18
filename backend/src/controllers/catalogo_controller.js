const { TipoServico } = require('../models');

exports.listTipos = async (req, res) => {
  try {
    const itens = await TipoServico.findAll({
      // Lê do banco o campo 'nome' e devolve como 'nomeServico' (alias)
      attributes: [
        'id',
        ['nome', 'nomeServico']
      ],
      order: [['nome', 'ASC']],
      raw: true,
    });

    return res.json(itens);
  } catch (err) {
    console.error('❌ listTipos:', err);
    return res.status(500).json({ error: 'Erro ao listar tipos de serviço.' });
  }
};
