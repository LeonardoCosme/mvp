// src/middleware/authenticate.js
const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticação JWT
 * 
 * Espera o header:
 *   Authorization: Bearer <token>
 * 
 * Se o token for válido, adiciona `req.user = { id, tipo }`
 * Caso contrário, retorna 401 com mensagem adequada.
 */
module.exports = function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token ausente.' });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({ error: 'Token ausente.' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.warn('⚠️  JWT_SECRET não definido no .env — usando chave padrão.');
    }

    const payload = jwt.verify(token, secret || 'chave_secreta_padrao');

    // adiciona informações do usuário ao request
    req.user = { id: payload.id, tipo: payload.tipo };
    next();
  } catch (err) {
    console.error('❌ authenticate:', err.message);
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};
