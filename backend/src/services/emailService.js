const { Resend } = require('resend');
const { emailBase } = require('../templates/emailBase');
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envia um e-mail estilizado usando o template base
 */
async function sendStyledEmail(to, subject, content) {
  const html = emailBase(content);

  try {
    const data = await resend.emails.send({
      from: 'Equipe Marido de Aluguel <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    console.log(`📧 E-mail enviado para ${to}: ${subject}`);
    return data;
  } catch (err) {
    console.error('❌ Erro ao enviar e-mail:', err);
    throw new Error('Falha no envio de e-mail.');
  }
}

module.exports = { sendStyledEmail };
