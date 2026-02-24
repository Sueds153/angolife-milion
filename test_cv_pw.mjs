import { chromium } from 'playwright';
import * as path from 'path';

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });

    const artifactsPath = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\5767fddb-d60c-4d19-8a41-baa8c96afff6';

    try {
        // 1. Login
        await page.goto('http://localhost:3000');
        await page.waitForSelector('button');
        const loginBtn = await page.getByRole('button', { name: /login/i }).first();
        if (loginBtn) await loginBtn.click();

        await page.waitForSelector('input[type="email"]');
        await page.fill('input[type="email"]', 'admin9@admin.com');
        await page.fill('input[type="password"]', 'admin');

        const enterBtn = await page.getByRole('button', { name: 'Entrar' });
        if (enterBtn) await enterBtn.click();

        await page.waitForTimeout(2000); // wait for navigation

        // 2. Go to CV Builder
        const cvLink = await page.getByText('Criar CV');
        if (cvLink) await cvLink.click();

        await page.waitForTimeout(3000);

        // 3. Capture Classic Template
        await page.screenshot({ path: path.join(artifactsPath, 'cv_builder_classic_template_pw.png') });
        console.log('Captured Classic Template');

        // 4. Input standard data (Name)
        const nameInput = await page.locator('input').first();
        await nameInput.fill('João da Silva');

        await page.waitForTimeout(1000);

        // 5. Change to Modern Template
        const modernBtn = await page.getByRole('button', { name: /Moderno/i });
        if (modernBtn) await modernBtn.click();

        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(artifactsPath, 'cv_builder_modern_template_pw.png') });
        console.log('Captured Modern Template');

        // 6. Change to Minimalist Template
        const minimalistBtn = await page.getByRole('button', { name: /Minimalista/i });
        if (minimalistBtn) await minimalistBtn.click();

        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(artifactsPath, 'cv_builder_minimalist_template_pw.png') });
        console.log('Captured Minimalist Template');

        // 7. Change to Technical Template
        const techBtn = await page.getByRole('button', { name: /Técnico/i });
        if (techBtn) await techBtn.click();

        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(artifactsPath, 'cv_builder_technical_template_pw.png') });
        console.log('Captured Technical Template');

    } catch (error) {
        console.error('Error during automation:', error);
    } finally {
        await browser.close();
    }
}

run();
