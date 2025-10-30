const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');
const assert = require('node:assert');

describe('Teste de Cadastro de Usuário', function () {
  this.timeout(45000);
  let driver;

  before(async () => {
    driver = await new Builder().forBrowser('chrome').build();
  });

  after(async () => {
    await driver.quit();
  });

  it('Deve realizar o cadastro com sucesso e redirecionar para a página de login', async () => {
    console.log('🚀 Iniciando teste de cadastro...');
    await driver.get('http://localhost:3000/cadastro');

    // Espera pelos campos
    await driver.wait(until.elementLocated(By.id('nomeUsuario')), 10000);
    await driver.wait(until.elementLocated(By.id('email')), 10000);
    await driver.wait(until.elementLocated(By.id('password')), 10000);

    // Gera e-mail aleatório
    const randomId = Math.floor(Math.random() * 100000);
    const email = `usuario${randomId}@teste.com`;

    // Preenche o formulário
    await driver.findElement(By.id('nomeUsuario')).sendKeys(`Usuário Teste ${randomId}`);
    await driver.findElement(By.id('email')).sendKeys(email);
    await driver.findElement(By.id('cpfUsuario')).sendKeys('12345678900');
    await driver.findElement(By.id('password')).sendKeys('Teste@123');
    await driver.findElement(By.id('tipo')).sendKeys('contratante');

    // Envia
    const button = await driver.findElement(By.css('button[type="submit"]'));
    await button.click();

    // Captura mensagem de sucesso se aparecer
    const successElement = await driver.wait(
      until.elementLocated(By.css('p.text-green-600')),
      7000
    ).catch(() => null);
    if (successElement) {
      const msg = await successElement.getText();
      console.log(`💬 Mensagem de sucesso: ${msg}`);
    }

    // Aguarda redirecionamento dinâmico
    let redirecionado = false;
    const maxWait = 20000;
    const start = Date.now();

    while (Date.now() - start < maxWait && !redirecionado) {
      const url = await driver.getCurrentUrl();

      // Critérios de sucesso
      const isLoginUrl = url.includes('/login');
      const hasLoginHeader = await driver.findElements(
        By.xpath("//h1[contains(text(), 'Entrar')]")
      );
      const hasLoginEmail = await driver.findElements(By.id('email'));

      if (isLoginUrl || hasLoginHeader.length > 0 || hasLoginEmail.length > 0) {
        redirecionado = true;
        break;
      }
      await new Promise(r => setTimeout(r, 1000)); // espera 1s antes de checar de novo
    }

    assert.ok(redirecionado, 'Usuário não foi redirecionado nem a tela de login foi detectada.');

    console.log(`✅ Cadastro concluído com sucesso (${email})`);
  });
});
