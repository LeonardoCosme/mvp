import express from "express";
import { login, register, forgotPassword } from "../controllers/auth_controller.js";

const router = express.Router();

// 🔐 Login
router.post("/login", (req, res, next) => {
  console.log("📩 Rota /api/login acessada");
  return login(req, res, next);
});

// 🧾 Cadastro
router.post("/register", (req, res, next) => {
  console.log("📩 Rota /api/register acessada");
  return register(req, res, next);
});

// 🔑 Esqueci minha senha
router.post("/forgot-password", (req, res, next) => {
  console.log("📩 Rota /api/forgot-password acessada");
  return forgotPassword(req, res, next);
});

export default router;
