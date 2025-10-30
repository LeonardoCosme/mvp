const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');

describe('Teste da Página Home', function () {
  this.timeout(60000);
  let driver;

  before(async () => {
    driver = await new Builder().forBrowser('chrome').build();
  });

  after(async () => {
    await driver.quit();
  });

  it('Deve logar com usuário fixo e exibir a página Home corretamente', async () => {
    console.log('🚀 Iniciando teste da Home com usuário fixo');

    // 1️⃣ Acessa a tela de login
    await driver.get('http://localhost:3000/login');
    await driver.wait(until.elementLocated(By.id('email')), 15000);
    await driver.wait(until.elementLocated(By.id('password')), 15000);

    // 2️⃣ Faz login com usuário existente
    const email = 'tcc@teste.com';
    const senha = '@Aa123456789';

    await driver.findElement(By.id('email')).clear();
    await driver.findElement(By.id('email')).sendKeys(email);
    await driver.findElement(By.id('password')).clear();
    await driver.findElement(By.id('password')).sendKeys(senha);
    await driver.findElement(By.css('button[type="submit"]')).click();

    // 3️⃣ Aguarda o redirecionamento para /home
    await driver.wait(until.urlContains('/home'), 20000);

    // 4️⃣ Espera o título de boas-vindas
    const titulo = await driver.wait(
      until.elementLocated(By.xpath("//h1[contains(., 'Bem-vindo')]")),
      15000
    );
    const textoTitulo = await titulo.getText();
    console.log(`👤 Título encontrado: ${textoTitulo}`);
    assert.ok(textoTitulo.includes('Bem-vindo'), 'Texto de boas-vindas não encontrado.');

    // 5️⃣ Verifica os botões principais conforme HTML real
    const botoes = [
      { texto: 'Explorar serviços', href: '/home' },
      { texto: 'Meu perfil', href: '/perfil' },
      { texto: 'Catálogo de Serviços', href: '/servicos' },
    ];

    for (const botao of botoes) {
      const elemento = await driver.wait(
        until.elementLocated(By.xpath(`//a[@href='${botao.href}']`)),
        10000
      );
      const visivel = await elemento.isDisplayed();
      assert.ok(visivel, `Botão "${botao.texto}" não está visível na Home.`);
      console.log(`✅ Botão "${botao.texto}" encontrado.`);
    }

    console.log('✅ Página Home validada com sucesso.');
  });
});
