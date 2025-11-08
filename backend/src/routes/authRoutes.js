import express from "express";
import { login, forgotPassword } from "../controllers/authController.js";

const router = express.Router();

// 🔐 Login
router.post("/login", login);

// 🔑 Esqueci minha senha
router.post("/forgot-password", forgotPassword);

export default router;
