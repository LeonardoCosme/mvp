import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import models from '../models/index.js';

const { Usuario } = models;

// 🔐 LOGIN
export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Verifica se o usuário existe
    const user = await Usuario.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verifica se a senha é válida
    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Gera token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'chave-secreta-temporaria',
      { expiresIn: '1h' }
    );

    return res.json({ message: 'Login realizado com sucesso', token });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno ao efetuar login' });
  }
};

// 🔑 ESQUECI MINHA SENHA
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Verifica se o e-mail existe no banco
    const user = await Usuario.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Aqui você poderia enviar um e-mail real com link de redefinição
    console.log(`🟡 Recuperação de senha solicitada para: ${email}`);

    return res.json({
      message: `Instruções de recuperação enviadas para ${email}`,
    });
  } catch (error) {
    console.error('Erro no esqueci minha senha:', error);
    res.status(500).json({ error: 'Erro ao processar recuperação de senha' });
  }
};
