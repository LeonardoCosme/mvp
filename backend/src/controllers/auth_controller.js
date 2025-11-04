const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
require('dotenv').config();

/**
 * 🔧 Valida os campos do registro
 */
function validarCampos({ nomeUsuario, email, password, tipo, cpfUsuario }) {
  if (!nomeUsuario) return 'O nome é obrigatório.';
  if (!email) return 'O e-mail é obrigatório.';
  if (!password) return 'A senha é obrigatória.';
  if (!['master', 'prestador', 'contratante'].includes(tipo))
    return 'Tipo inválido. Use master, prestador ou contratante.';
  if (cpfUsuario && cpfUsuario.length !== 11)
    return 'CPF inválido. Use 11 dígitos numéricos.';
  return null;
}

/**
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    let { nomeUsuario, email, password, tipo, cpfUsuario } = req.body || {};
    nomeUsuario = (nomeUsuario || '').trim();
    email = (email || '').trim().toLowerCase();
    password = (password || '').trim();
    tipo = (tipo || '').trim();
    cpfUsuario = (cpfUsuario || '').replaceAll(/\D/g, '');

    const erro = validarCampos({ nomeUsuario, email, password, tipo, cpfUsuario });
    if (erro) return res.status(400).json({ error: erro });

    const emailExist = await Usuario.findOne({ where: { email } });
    if (emailExist) return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });

    if (cpfUsuario) {
      const cpfExist = await Usuario.findOne({ where: { cpfUsuario } });
      if (cpfExist) return res.status(409).json({ error: 'Este CPF já está cadastrado.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const novo = await Usuario.create({
      nomeUsuario,
      cpfUsuario: cpfUsuario || null,
      email,
      senha: hashed,
      tipo,
    });

    return res.status(201).json({
      id: novo.id,
      nomeUsuario: novo.nomeUsuario,
      email: novo.email,
      tipo: novo.tipo,
    });
  } catch (err) {
    const code = err?.original?.code || err?.parent?.code;
    const msg = (err?.original?.sqlMessage || err?.parent?.sqlMessage || '').toLowerCase();

    if (code === 'ER_DUP_ENTRY') {
      if (msg.includes('cpf')) return res.status(409).json({ error: 'Este CPF já está cadastrado.' });
      if (msg.includes('email')) return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
      return res.status(409).json({ error: 'Registro duplicado.' });
    }

    console.error('❌ Erro no register:', err);
    return res.status(500).json({ error: 'Erro interno no registro.' });
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    let { email, password } = req.body || {};
    email = (email || '').trim().toLowerCase();
    password = (password || '').trim();

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const user = await Usuario.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado.' });

    const ok = await bcrypt.compare(password, user.senha || user.password);
    if (!ok) return res.status(401).json({ error: 'Senha incorreta.' });

    const token = jwt.sign(
      { id: user.id, tipo: user.tipo },
      process.env.JWT_SECRET || 'chave_secreta_padrao',
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      token,
      nomeUsuario: user.nomeUsuario,
      tipo: user.tipo,
    });
  } catch (err) {
    console.error('❌ Erro no login:', err);
    return res.status(500).json({ error: 'Erro interno no login.' });
  }
}

module.exports = { register, login };