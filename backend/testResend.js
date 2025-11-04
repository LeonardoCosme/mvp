require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

try {
  const result = await resend.emails.send({
    from: 'Marido de Aluguel <onboarding@resend.dev>',
    to: 'rep.csantos@gmail.com',
    subject: 'Teste de envio Resend',
    html: '<h1>Teste de envio com onboarding@resend.dev</h1><p>Se você está lendo isso, deu certo 🎉</p>',
  });

  console.log('📨 E-mail enviado com sucesso:', result);
} catch (err) {
  console.error('❌ Erro ao enviar e-mail:', err);
}