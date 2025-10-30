// customize-report.js
const fs = require('node:fs');
const path = require('node:path');

const reportDir = path.join(__dirname, 'mochawesome-report');
const reportFile = path.join(reportDir, 'mochawesome.html');

function customizeReport() {
  if (!fs.existsSync(reportFile)) {
    console.error('❌ Relatório HTML não encontrado.');
    return;
  }

  let html = fs.readFileSync(reportFile, 'utf8');

  // 🎨 Inserir logotipo e título personalizado no cabeçalho
  const header = `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
      <img src="logo.png" alt="Logo Marido de Aluguel" style="height:60px;">
      <h1 style="color:#8F1D14;font-family:Arial,Helvetica,sans-serif;font-size:28px;">
        Relatório de Testes – Sistema <span style="color:#F89D13;">Marido de Aluguel</span>
      </h1>
    </div>
  `;

  html = html.replace('<body>', `<body>${header}`);

  // 🎨 Inserir rodapé institucional
  const footer = `
    <footer style="text-align:center;margin-top:40px;padding:20px;border-top:2px solid #F89D13;color:#8F1D14;">
      <p><strong>Projeto Integrador – TCC</strong></p>
      <p>Sistema Marido de Aluguel | Desenvolvido para o TCC – Curso Técnico em Desenvolvimento de Sistemas "FATEC-IPIRANGA"</p>
    </footer>
  `;
  html = html.replace('</body>', `${footer}</body>`);

  // 🎨 Alterar cores principais do relatório
  html = html.replaceAll('#00aeef', '#F89D13'); // muda azul padrão para laranja
  html = html.replaceAll('#2c3e50', '#8F1D14'); // muda azul escuro para vinho

  fs.writeFileSync(reportFile, html, 'utf8');
  console.log('✨ Relatório Mochawesome personalizado com sucesso!');
}

customizeReport();
