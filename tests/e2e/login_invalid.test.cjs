const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');
const assert = require('node:assert');

describe('Teste de Login Inválido', function () {
  this.timeout(20000);
  let driver;

  before(async () => {
    driver = await new Builder().forBrowser('chrome').build();
  });

  after(async () => {
    await driver.quit();
  });

  it('Deve exibir mensagem de erro ao informar credenciais inválidas', async () => {
    await driver.get('http://localhost:3000/login');
    await driver.findElement(By.id('email')).sendKeys('usuarioinvalido@teste.com');
    await driver.findElement(By.id('password')).sendKeys('senhaerrada');
    await driver.findElement(By.css('button[type="submit"]')).click();

    const errorElement = await driver.wait(
      until.elementLocated(By.css('p.text-red-600')),
      10000
    );
    const errorText = await errorElement.getText();

    assert.ok(
  errorText.includes('Erro ao entrar') ||
  errorText.includes('Informe e-mail e senha') ||
  errorText.includes('Usuário não encontrado'),
  `Mensagem inesperada: ${errorText}`
);
  });
});
