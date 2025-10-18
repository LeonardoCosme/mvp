// src/controllers/user_controller.js
const { Usuario, Prestador, Contratante } = require('../models');

/**
 * GET /api/user/me
 * Retorna o usuário autenticado + anexos (prestador/contratante), sem expor senha.
 */
async function me(req, res) {
  try {
    const { id } = req.user;

    const user = await Usuario.findByPk(id, {
      attributes: [
        'id',
        'nomeUsuario',
        'cpfUsuario',
        'email',
        'tipo',
        'created_at',
        'updated_at',
      ],
      include: [
        {
          model: Prestador,
          as: 'prestador',
          attributes: ['id', 'cnpjPrestador', 'celPrestador', 'created_at', 'updated_at'],
          required: false,
        },
        {
          model: Contratante,
          as: 'contratante',
          attributes: ['id', 'endereco', 'telefone', 'created_at', 'updated_at'],
          required: false,
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Retorno direto do Sequelize já é JSON-serializable e não inclui senha
    return res.status(200).json(user);
  } catch (err) {
    console.error('❌ user.me:', err);
    return res.status(500).json({ error: 'Erro ao obter dados do usuário.' });
  }
}

module.exports = { me };
