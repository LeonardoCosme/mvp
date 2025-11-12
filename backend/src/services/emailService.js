// src/services/emailService.js
import dotenv from "dotenv";
import { Resend } from "resend";
import emailBase from "../templates/emailBase.js";

// ✅ Carrega variáveis de ambiente (somente se não estiver em produção)
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

// 🔹 Garante que a variável existe antes de inicializar o Resend
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn("⚠️ AVISO: RESEND_API_KEY não está definida no .env — e-mails não serão enviados.");
}

// 🔹 Só inicializa o Resend se a chave existir
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Envia um e-mail estilizado usando o template base.
 * @param {string|string[]} to - Destinatário(s)
 * @param {string} subject - Assunto do e-mail
 * @param {object} content - Objeto com { title, message, buttonText, buttonLink }
 */
export async function sendStyledEmail(to, subject, content = {}) {
  // Garante que o HTML será gerado mesmo que falte alguma parte do conteúdo
  const html = emailBase({
    title: content.title || subject,
    message: content.message || "",
    buttonText: content.buttonText || "",
    buttonLink: content.buttonLink || "",
  });

  try {
    // Se não houver API Key, loga o e-mail em vez de tentar enviar (modo seguro)
    if (!resend) {
      console.log(`📭 Simulação de envio de e-mail (sem API KEY):
Para: ${to}
Assunto: ${subject}
Conteúdo: ${html}`);
      return { simulated: true };
    }

    // Envia o e-mail real
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM || "Equipe Marido de Aluguel <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    console.log(`📧 E-mail enviado com sucesso para ${to}: ${subject}`);
    return data;
  } catch (err) {
    console.error("❌ Erro ao enviar e-mail:", err);
    throw new Error("Falha no envio de e-mail.");
  }
}
