// backend/src/middleware/authenticate.js
import jwt from "jsonwebtoken";

export default function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token ausente." });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({ error: "Token ausente." });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.warn("⚠️ JWT_SECRET não definido no .env — usando chave padrão.");
    }

    // 🔎 Apenas para o MVP / desenvolvimento:
    // - verifica a assinatura
    // - NÃO falha por causa de expiração
    const payload = jwt.verify(token, secret || "chave_secreta_padrao", {
      ignoreExpiration: true, // <<<<<<<<<<<<<<<<<<<<<<
    });

    // Só pra conferência/debug: loga os tempos do token
    if (payload && payload.iat && payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      console.log("🔐 Token recebido:", {
        id: payload.id,
        tipo: payload.tipo,
        iat: payload.iat,
        exp: payload.exp,
        now,
      });
    }

    req.user = { id: payload.id, tipo: payload.tipo };
    next();
  } catch (err) {
    console.error("❌ authenticate:", err.message);
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}
