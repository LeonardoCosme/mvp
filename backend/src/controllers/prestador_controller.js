// src/controllers/prestador_controller.js
const { Op } = require('sequelize');
const { Prestador, Usuario } = require('../models');

/**
 * GET /api/prestador/me
 * Retorna dados do prestador do usuário autenticado.
 */
async function me(req, res) {
  try {
    const userId = req.user.id;

    const user = await Usuario.findByPk(userId, {
      attributes: ['id', 'nomeUsuario', 'email', 'cpfUsuario', 'tipo', 'created_at', 'updated_at'],
    });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const prest = await Prestador.findOne({
      where: { usuario_id: userId },
      attributes: ['id', 'usuario_id', 'cnpjPrestador', 'celPrestador', 'created_at', 'updated_at'],
    });

    return res.status(200).json({
      exists: !!prest,
      user,
      prestador: prest || null,
    });
  } catch (err) {
    console.error('❌ Prestador.me:', err);
    return res.status(500).json({ error: 'Erro ao obter dados do prestador.' });
  }
}

/**
 * POST /api/prestador
 * Upsert do cadastro do prestador do usuário autenticado.
 * Body (enviar apenas o que quiser alterar):
 * {
 *   nomeUsuario?, emailUsuario?, cpfUsuario?,   // USUÁRIO
 *   cnpjPrestador?, celPrestador?               // PRESTADOR
 * }
 */
async function save(req, res) {
  try {
    const userId = req.user.id;

    // Normalizações
    let {
      nomeUsuario,
      emailUsuario,
      cpfUsuario,
      cnpjPrestador,
      celPrestador,
    } = req.body || {};

    if (typeof nomeUsuario === 'string') nomeUsuario = nomeUsuario.trim();
    if (typeof emailUsuario === 'string') emailUsuario = emailUsuario.trim().toLowerCase();
    if (typeof cpfUsuario === 'string') cpfUsuario = cpfUsuario.replace(/\D/g, ''); // só dígitos
    if (typeof cnpjPrestador === 'string') cnpjPrestador = cnpjPrestador.trim();
    if (typeof celPrestador === 'string') celPrestador = celPrestador.trim();

    const user = await Usuario.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    // -------------------------------
    // 🔎 Validações de unicidade (usuarios)
    // -------------------------------
    if (emailUsuario && emailUsuario !== user.email) {
      const existsEmail = await Usuario.findOne({
        where: { email: emailUsuario, id: { [Op.ne]: userId } }, // exclui o próprio
        attributes: ['id'],
      });
      if (existsEmail) return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    }

    if (cpfUsuario && cpfUsuario !== user.cpfUsuario) {
      if (cpfUsuario.length !== 11) {
        return res.status(400).json({ error: 'CPF inválido. Use 11 dígitos numéricos.' });
      }
      const existsCPF = await Usuario.findOne({
        where: { cpfUsuario, id: { [Op.ne]: userId } }, // exclui o próprio
        attributes: ['id'],
      });
      if (existsCPF) return res.status(409).json({ error: 'Este CPF já está cadastrado.' });
    }

    // -------------------------------
    // ✏️ Atualiza dados do usuário (opcionais)
    // -------------------------------
    const toUpdateUser = {};
    if (nomeUsuario) toUpdateUser.nomeUsuario = nomeUsuario;
    if (emailUsuario) toUpdateUser.email = emailUsuario;
    if (cpfUsuario) toUpdateUser.cpfUsuario = cpfUsuario;

    if (Object.keys(toUpdateUser).length > 0) {
      await user.update(toUpdateUser);
    }

    // -------------------------------
    // 🧱 Upsert do Prestador
    // -------------------------------
    const [prest, created] = await Prestador.findOrCreate({
      where: { usuario_id: userId },
      defaults: {
        usuario_id: userId,
        cnpjPrestador: cnpjPrestador ?? null,
        celPrestador:  celPrestador  ?? null,
      },
    });

    if (!created) {
      await prest.update({
        cnpjPrestador: typeof cnpjPrestador === 'string' ? cnpjPrestador : prest.cnpjPrestador,
        celPrestador:  typeof celPrestador  === 'string' ? celPrestador  : prest.celPrestador,
      });
    }

    const fresh = await Prestador.findOne({
      where: { usuario_id: userId },
      attributes: ['id', 'usuario_id', 'cnpjPrestador', 'celPrestador', 'created_at', 'updated_at'],
    });

    return res.status(created ? 201 : 200).json({
      created,
      user: {
        id: user.id,
        nomeUsuario: user.nomeUsuario,
        email: user.email,
        cpfUsuario: user.cpfUsuario,
        tipo: user.tipo,
      },
      prestador: fresh,
    });
  } catch (err) {
    // Backup para colisões únicas diretamente do BD
    if (err?.original?.code === 'ER_DUP_ENTRY') {
      const msg = String(err?.original?.sqlMessage || '').toLowerCase();
      if (msg.includes('cpf'))  return res.status(409).json({ error: 'Este CPF já está cadastrado.' });
      if (msg.includes('email'))return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
      return res.status(409).json({ error: 'Registro duplicado.' });
    }

    console.error('❌ Prestador.save:', err);
    return res.status(500).json({ error: 'Erro ao salvar dados do prestador.' });
  }
}

module.exports = { me, save };
