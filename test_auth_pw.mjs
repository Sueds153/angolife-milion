import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

async function run() {
    const artifactsPath = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\5767fddb-d60c-4d19-8a41-baa8c96afff6';
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });

    try {
        // 1. Ir para App
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);

        // 2. Abrir Modal de Auth
        const loginBtn = await page.getByRole('button', { name: /login/i }).first();
        await loginBtn.click();
        await page.waitForTimeout(1000);

        // 3. Testar Admin Email
        console.log("Testing Admin Email login...");
        await page.fill('input[placeholder="exemplo@angolife.ao ou 92X..."]', 'suedjosue@gmail.com');
        await page.fill('input[type="password"]', 'pass');
        await page.getByRole('button', { name: 'Entrar' }).click();

        // Esperar alert "Login efetuado com sucesso!" (simulated API is set to 1s)
        page.on('dialog', async dialog => {
            console.log('Dialog text:', dialog.message());
            await dialog.accept();
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(artifactsPath, 'admin_logged_in.png') });
            console.log('Saved admin logged in screenshot.');
        });

        await page.waitForTimeout(2000);

        // 4. Logout (simples: refresh ou click menu)
        await page.goto('http://localhost:3000'); // Refresh
        await page.waitForTimeout(1000);
        // Assumir que admin tá logged in from mockup localstorage auth_token flag, but user var resets since mock doesn't persist `user` object in localStorage in this App.tsx version unless logged in.
        // Actually the mock auth doesn't persist `user`, it just sets `isAuthenticated`. The user data relies on memory handleLoginSuccess.
        // So if it was lost, we just retry.

        // To truly logout and retry we clear local storage
        await page.evaluate(() => { localStorage.clear() });
        await page.reload();
        await page.waitForTimeout(1000);

        // 5. Testar Invalid Phone Number
        console.log("Testing Invalid Phone Number...");
        await page.getByRole('button', { name: /login/i }).first().click();
        await page.waitForTimeout(1000);

        await page.fill('input[placeholder="exemplo@angolife.ao ou 92X..."]', '882345678'); // Not starting with 9
        await page.fill('input[type="password"]', 'pass');
        await page.getByRole('button', { name: 'Entrar' }).click();
        await page.waitForTimeout(500);

        // Capture Error UI
        await page.screenshot({ path: path.join(artifactsPath, 'invalid_phone_error.png') });
        console.log('Saved invalid phone screenshot');

        // 6. Testar Valid Phone Number
        console.log("Testing Valid Angolan Phone Number...");
        await page.fill('input[placeholder="exemplo@angolife.ao ou 92X..."]', '923456789'); // Correct digits
        await page.getByRole('button', { name: 'Entrar' }).click();
        await page.waitForTimeout(2000); // Wait for alert logic

    } catch (err) {
        console.error('Test script error:', err);
    } finally {
        await browser.close();
    }
}

run();
