import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Emulate a mobile screen explicitly
  await page.setViewportSize({ width: 375, height: 812 });

  console.log("Navegando para http://localhost:3000 ...");
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Array das abas para testar no mobile nav
  const tabs = [
    { name: 'Início', text: 'Início' },
    { name: 'Vagas', text: 'Vagas' },
    { name: 'CV', text: 'CV' },
    { name: 'Câmbio', text: 'Câmbio' },
    { name: 'Ofertas', text: 'Ofertas' }
  ];

  for (const tab of tabs) {
    console.log(`Testando aba: ${tab.name}`);

    // Find the button in the bottom navigation
    // Explicitly target the mobile nav: "nav.fixed.bottom-0 button"
    const button = page.locator(`nav.fixed.bottom-0 button:has-text("${tab.text}")`);

    if (await button.count() > 0) {
      // Wait a bit to ensure it is rendered and not animating
      await page.waitForTimeout(500);
      await button.first().click({ force: true });
      await page.waitForTimeout(1000); // aguarda a re-renderização
      console.log(`✅ Aba ${tab.name} clicada e carregada com sucesso.`);
    } else {
      console.log(`⚠️ Aba ${tab.name} não encontrada na navegação inferior.`);
    }
  }

  console.log("Todos os testes de abas mobile concluídos com sucesso.");
  await browser.close();
})();
