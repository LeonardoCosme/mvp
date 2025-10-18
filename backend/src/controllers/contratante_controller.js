// src/controllers/contratante_controller.js
const { Op } = require('sequelize');
const { Usuario, Contratante } = require('../models');

/* ---------- Helpers ---------- */

function normalize(body = {}) {
  const out = { ...body };
  if (typeof out.nomeUsuario === 'string') out.nomeUsuario = out.nomeUsuario.trim();
  if (typeof out.emailUsuario === 'string') out.emailUsuario = out.emailUsuario.trim().toLowerCase();
  if (typeof out.cpfUsuario === 'string') out.cpfUsuario = out.cpfUsuario.replace(/\D/g, '');
  return out;
}

async function findUserOr404(id, res) {
  const user = await Usuario.findByPk(id);
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado.' });
    return null;
  }
  return user;
}

async function ensureUniqueEmailCpf({ emailUsuario, cpfUsuario, userId, current }, res) {
  if (emailUsuario && emailUsuario !== current.email) {
    const dupeEmail = await Usuario.findOne({
      where: { email: emailUsuario, id: { [Op.ne]: userId } },
      attributes: ['id'],
    });
    if (dupeEmail) {
      res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
      return false;
    }
  }

  if (cpfUsuario && cpfUsuario !== current.cpfUsuario) {
    if (cpfUsuario.length !== 11) {
      res.status(400).json({ error: 'CPF inválido. Use 11 dígitos.' });
      return false;
    }
    const dupeCpf = await Usuario.findOne({
      where: { cpfUsuario, id: { [Op.ne]: userId } },
      attributes: ['id'],
    });
    if (dupeCpf) {
      res.status(409).json({ error: 'Este CPF já está cadastrado.' });
      return false;
    }
  }
  return true;
}

function buildUserPatch({ nomeUsuario, emailUsuario, cpfUsuario }) {
  const patch = {};
  if (nomeUsuario) patch.nomeUsuario = nomeUsuario;
  if (emailUsuario) patch.email = emailUsuario;
  if (cpfUsuario) patch.cpfUsuario = cpfUsuario;
  return patch;
}

async function upsertContratante(userId, { endereco, telefone }) {
  const [c, created] = await Contratante.findOrCreate({
    where: { usuario_id: userId },
    defaults: {
      usuario_id: userId,
      endereco: endereco ?? null,
      telefone: telefone ?? null,
    },
  });

  if (!created) {
    const changes = {};
    if (typeof endereco === 'string') changes.endereco = endereco;
    if (typeof telefone === 'string') changes.telefone = telefone;
    if (Object.keys(changes).length > 0) await c.update(changes);
  }

  const fresh = await Contratante.findOne({
    where: { usuario_id: userId },
    attributes: ['id', 'usuario_id', 'endereco', 'telefone', 'created_at', 'updated_at'],
  });

  return { fresh, created };
}

function mapDuplicateError(err, res) {
  if (err?.original?.code !== 'ER_DUP_ENTRY') return false;
  const m = String(err?.original?.sqlMessage || '').toLowerCase();
  if (m.includes('cpf')) {
    res.status(409).json({ error: 'Este CPF já está cadastrado.' });
    return true;
  }
  if (m.includes('email')) {
    res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    return true;
  }
  res.status(409).json({ error: 'Registro duplicado.' });
  return true;
}

/* ---------- Controller ---------- */

exports.save = async (req, res) => {
  try {
    const userId = req.user.id;
    const payload = normalize(req.body);

    const user = await findUserOr404(userId, res);
    if (!user) return;

    const uniqueOk = await ensureUniqueEmailCpf(
      { emailUsuario: payload.emailUsuario, cpfUsuario: payload.cpfUsuario, userId, current: user },
      res
    );
    if (!uniqueOk) return;

    const patch = buildUserPatch(payload);
    if (Object.keys(patch).length > 0) await user.update(patch);

    const { fresh, created } = await upsertContratante(userId, payload);

    res.status(created ? 201 : 200).json({
      created,
      user: {
        id: user.id,
        nomeUsuario: user.nomeUsuario,
        email: user.email,
        cpfUsuario: user.cpfUsuario,
        tipo: user.tipo,
      },
      contratante: fresh,
    });
  } catch (err) {
    if (mapDuplicateError(err, res)) return;
    console.error('❌ Contratante.save:', err);
    res.status(500).json({ error: 'Erro ao salvar dados do contratante.' });
  }
};
