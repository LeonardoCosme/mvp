import express from "express";
import {
  login,
  register,
  forgotPassword,
} from "../controllers/authController.js";

const router = express.Router();

// 🔐 Login
router.post("/login", login);

// 🧾 Cadastro
router.post("/register", register);

// 🔑 Esqueci minha senha
router.post("/forgot-password", forgotPassword);

// ✅ Teste rápido
router.get("/", (req, res) => {
  res.json({ message: "🔗 Rotas de autenticação ativas!" });
});

export default router;
