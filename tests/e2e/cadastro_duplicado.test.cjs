const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');
const assert = require('node:assert');

describe('Teste de Cadastro Duplicado', function () {
  this.timeout(30000);
  let driver;

  before(async () => {
    driver = await new Builder().forBrowser('chrome').build();
  });

  after(async () => {
    await driver.quit();
  });

  it('Deve exibir mensagem de erro ao tentar cadastrar um e-mail já existente', async () => {
    // 1️⃣ Abre a página de cadastro
    await driver.get('http://localhost:3000/cadastro');

    // 2️⃣ Aguarda os campos principais
    await driver.wait(until.elementLocated(By.id('nomeUsuario')), 10000);
    await driver.wait(until.elementLocated(By.id('email')), 10000);
    await driver.wait(until.elementLocated(By.id('password')), 10000);

    // 3️⃣ Usa um e-mail fixo já existente no banco
    const emailDuplicado = 'teste@exemplo.com'; // substitua por um e-mail já cadastrado

    // 4️⃣ Preenche o formulário
    await driver.findElement(By.id('nomeUsuario')).clear();
    await driver.findElement(By.id('nomeUsuario')).sendKeys('Usuário Duplicado');
    await driver.findElement(By.id('email')).clear();
    await driver.findElement(By.id('email')).sendKeys(emailDuplicado);
    await driver.findElement(By.id('cpfUsuario')).clear();
    await driver.findElement(By.id('cpfUsuario')).sendKeys('11122233344');
    await driver.findElement(By.id('password')).clear();
    await driver.findElement(By.id('password')).sendKeys('Teste@123');
    await driver.findElement(By.id('tipo')).sendKeys('prestador');

    // 5️⃣ Envia o formulário
    const button = await driver.findElement(By.css('button[type="submit"]'));
    await button.click();

    // 6️⃣ Aguarda a mensagem de erro
    const errorElement = await driver.wait(
      until.elementLocated(By.css('p.text-red-600')),
      10000
    );

    const errorText = await errorElement.getText();

    // 7️⃣ Valida a mensagem
    assert.ok(
  errorText.includes('Erro') ||
  errorText.includes('já existe') ||
  errorText.includes('cadastrar') ||
  errorText.includes('Este e-mail já está cadastrado'),
  `Mensagem inesperada: ${errorText}`
);


    console.log(`❌ Cadastro duplicado corretamente bloqueado (${emailDuplicado})`);
  });
});
