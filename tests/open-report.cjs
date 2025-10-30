// open-report.cjs
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  // importa o módulo open de forma compatível
  const { default: open } = await import('open');

  const reportDir = path.join(__dirname, 'mochawesome-report');

  function getLatestReport() {
    const files = fs.readdirSync(reportDir)
      .filter(f => f.endsWith('.html'))
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(reportDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    return files.length > 0 ? path.join(reportDir, files[0].name) : null;
  }

  try {
    const latestReport = getLatestReport();
    if (!latestReport) {
      console.error('❌ Nenhum relatório encontrado na pasta mochawesome-report.');
      process.exit(1);
    }
    console.log(`📄 Abrindo relatório: ${latestReport}`);
    await open(latestReport);
  } catch (err) {
    console.error('⚠️ Erro ao abrir o relatório:', err);
  }
}

// executa dentro de uma função async (permitindo uso do await)
main();
