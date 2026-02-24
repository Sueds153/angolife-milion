import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

async function run() {
    const artifactsPath = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\5767fddb-d60c-4d19-8a41-baa8c96afff6';
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });

    try {
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);

        // 1. Open Auth Modal
        const loginBtn = await page.getByRole('button', { name: /login/i }).first();
        await loginBtn.click();
        await page.waitForTimeout(1000);

        // 2. Test Real Supabase Auth (Invalid Login)
        console.log("Testing Invalid Supabase Login...");
        await page.fill('input[type="email"]', 'teste.invalido@angolife.ao');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.getByRole('button', { name: 'Entrar' }).click();

        // Wait for the modal error state due to API rejection
        await page.waitForTimeout(2000);

        // Capture Error UI
        await page.screenshot({ path: path.join(artifactsPath, 'real_auth_error_ui.png') });
        console.log('Saved real auth error screenshot.');

        // 3. Open Registration
        await page.getByRole('button', { name: 'Criar Conta' }).click();
        await page.waitForTimeout(1000);

        // 4. Test Registration Loading State
        await page.fill('input[placeholder="Seu nome"]', 'Teste User');
        await page.fill('input[type="email"]', 'registration_test@angolife.ao');
        await page.fill('input[type="password"]', 'pass1234');

        // Quick screenshot of filled modal before submit
        await page.screenshot({ path: path.join(artifactsPath, 'real_auth_register_ui.png') });
        console.log('Saved real auth register screenshot.');

    } catch (err) {
        console.error('Test script error:', err);
    } finally {
        await browser.close();
    }
}

run();
