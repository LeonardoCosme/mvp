import express from "express";
import { login, register, forgotPassword } from "../controllers/authController.js";

const router = express.Router();

// 🔐 Login
router.post("/login", login);

// 🧾 Cadastro
router.post("/register", register);

// 🔑 Esqueci minha senha
router.post("/forgot-password", forgotPassword);

export default router;
