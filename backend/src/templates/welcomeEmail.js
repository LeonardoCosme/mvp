// backend/src/templates/welcomeEmail.js
const { emailBase } = require('./emailBase');

/**
 * Cria o template de boas-vindas e verificação de e-mail.
 * @param {string} nome - Nome do usuário
 * @param {string} linkVerificacao - Link para confirmação do e-mail
 * @returns {string} HTML completo do e-mail
 */
function welcomeEmail(nome, linkVerificacao) {
  return emailBase({
    title: 'Bem-vindo (a) ao Marido de Aluguel!',
    message: `
      Olá, <strong>${nome}</strong>!<br><br>
      Estamos muito felizes em ter você conosco. 🎉<br>
      Para começar a aproveitar todos os recursos, por favor confirme seu e-mail clicando no botão abaixo:<br><br>
      <em>Isso ajuda a manter sua conta segura e habilitar todos os serviços da plataforma.</em>
    `,
    buttonText: 'Verificar meu e-mail',
    buttonLink: linkVerificacao,
  });
}

module.exports = { welcomeEmail };
