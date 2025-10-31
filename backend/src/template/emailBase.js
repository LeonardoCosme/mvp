// backend/src/templates/emailBase.js
/**
 * Template HTML padrão para os e-mails do sistema.
 * Usa cores e identidade visual do Marido de Aluguel.
 */
function emailBase({ title, message, buttonText, buttonLink }) {
  return `
  <div style="font-family: 'Arial', sans-serif; background: #fdfaf6; padding: 24px; border-radius: 8px; border: 1px solid #eee; color: #333; max-width: 600px; margin: auto;">
    <div style="text-align:center;">
      <img src="https://i.imgur.com/H0P9xCe.png" alt="Logo Marido de Aluguel" style="max-height:70px; margin-bottom: 10px;" />
      <h2 style="color: #8F1D14; margin-bottom: 8px;">${title}</h2>
    </div>

    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
      ${message}
    </p>

    ${
      buttonText && buttonLink
        ? `<div style="text-align:center; margin: 30px 0;">
            <a href="${buttonLink}"
              style="
                background-color: #F89D13;
                color: white;
                padding: 12px 30px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: bold;
                letter-spacing: 0.5px;
              ">
              ${buttonText}
            </a>
          </div>`
        : ''
    }

    <hr style="border:none; border-top:1px solid #ddd; margin: 30px 0;" />
    <p style="font-size: 13px; color: #666; text-align:center;">
      © ${new Date().getFullYear()} Marido de Aluguel<br/>
      Este é um e-mail automático — não responda.
    </p>
  </div>`;
}

module.exports = { emailBase };
