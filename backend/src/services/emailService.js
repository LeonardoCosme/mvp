require('dotenv').config();
const { Resend } = require('resend');
const { emailBase } = require('../templates/emailBase');

// 🔹 Garante que a variável existe antes de inicializar o Resend
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('⚠️  AVISO: RESEND_API_KEY não está definida no .env — e-mails não serão enviados.');
}

// 🔹 Só inicializa o Resend se a chave existir
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Envia um e-mail estilizado usando o template base
 */
async function sendStyledEmail(to, subject, content) {
  // Garante que o HTML será gerado mesmo que falte alguma parte do conteúdo
  const html = emailBase(content || { title: subject, message: '', buttonText: '', buttonLink: '' });

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
      from: 'Equipe Marido de Aluguel <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    console.log(`📧 E-mail enviado com sucesso para ${to}: ${subject}`);
    return data;
  } catch (err) {
    console.error('❌ Erro ao enviar e-mail:', err);
    throw new Error('Falha no envio de e-mail.');
  }
}

module.exports = { sendStyledEmail };
