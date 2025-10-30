const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');
const assert = require('node:assert');

describe('Teste de Login Válido', function () {
  this.timeout(20000);
  let driver;

  before(async () => {
    driver = await new Builder().forBrowser('chrome').build();
  });

  after(async () => {
    await driver.quit();
  });

  it('Deve realizar login e redirecionar para /home', async () => {
    await driver.get('http://localhost:3000/login');
    await driver.findElement(By.id('email')).sendKeys('teste@exemplo.com');
    await driver.findElement(By.id('password')).sendKeys('@Aa123456789');
    await driver.findElement(By.css('button[type="submit"]')).click();
    await driver.wait(until.urlContains('/home'), 10000);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/home'), 'Usuário não foi redirecionado para /home');
  });
});
