const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function run() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const artifactsPath = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\5767fddb-d60c-4d19-8a41-baa8c96afff6';

    try {
        // 1. Login
        await page.goto('http://localhost:3000');
        await page.waitForSelector('button');
        await page.evaluate(() => {
            const loginBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Login'));
            if (loginBtn) loginBtn.click();
        });

        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', 'admin9@admin.com');
        await page.type('input[type="password"]', 'admin');
        await page.evaluate(() => {
            const enterBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Entrar'));
            if (enterBtn) enterBtn.click();
        });

        await page.waitForTimeout(2000); // wait for navigation

        // 2. Go to CV Builder
        await page.evaluate(() => {
            const navLinks = Array.from(document.querySelectorAll('a, button'));
            const cvLink = navLinks.find(el => el.textContent.includes('Criar CV'));
            if (cvLink) cvLink.click();
        });

        await page.waitForTimeout(2000);

        // 3. Capture Classic Template
        await page.screenshot({ path: path.join(artifactsPath, 'cv_builder_classic_template.png') });
        console.log('Captured Classic Template');

        // 4. Input standard data
        await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input'));
            if (inputs.length >= 4) {
                inputs[0].value = 'João da Silva';
                inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        await page.waitForTimeout(500);

        // 5. Change to Modern Template
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const modernBtn = buttons.find(b => b.textContent && b.textContent.includes('Moderno'));
            if (modernBtn) modernBtn.click();
        });
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(artifactsPath, 'cv_builder_modern_template.png') });
        console.log('Captured Modern Template');

        // 6. Change to Minimalist Template
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const btn = buttons.find(b => b.textContent && b.textContent.includes('Minimalista'));
            if (btn) btn.click();
        });
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(artifactsPath, 'cv_builder_minimalist_template.png') });
        console.log('Captured Minimalist Template');

        // 7. Change to Technical Template
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const btn = buttons.find(b => b.textContent && b.textContent.includes('Técnico'));
            if (btn) btn.click();
        });
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(artifactsPath, 'cv_builder_technical_template.png') });
        console.log('Captured Technical Template');

    } catch (error) {
        console.error('Error during automation:', error);
    } finally {
        await browser.close();
    }
}

run();
