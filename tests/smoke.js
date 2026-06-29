const { chromium } = require('playwright');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { startDesktopServers } = require('../desktop/local-server');
const { installLegacyCdnRoutes } = require('./helpers/legacy-cdn-routes');

(async () => {
    const projectRoot = path.resolve(__dirname, '..');
    const fileUrl = process.env.APP_URL || 'http://127.0.0.1:8000/main.html';
    const dataRoot = process.env.APP_URL ? null : await fs.mkdtemp(path.join(os.tmpdir(), 'writingway-smoke-'));
    const servers = process.env.APP_URL ? null : await startDesktopServers({
        appRoot: projectRoot,
        dataRoot,
        chooseBackupFolder: null,
        chooseProjectSaveFolder: null,
        openPath: null,
        revealPath: null
    });

    console.log('Opening:', fileUrl);

    let browser = null;

    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        await installLegacyCdnRoutes(context);
        const page = await context.newPage();

        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForSelector('.app-container, .welcome-screen', { timeout: 10000 });

        const gen = await page.$('[data-legacy-generate]');
        const welcome = await page.$('.welcome-screen');
        const projectLanding = await page.evaluate(() => document.body.innerText.includes('Writingway 2'));
        if (!gen && !welcome && !projectLanding) {
            console.error('ERROR: no writer, welcome, or project landing state found');
            process.exitCode = 2;
            return;
        }

        await page.waitForTimeout(1200);

        if (consoleErrors.length > 0) {
            console.error('Console errors were detected:');
            for (const error of consoleErrors) console.error('  -', error);
            process.exitCode = 3;
            return;
        }

        console.log('Smoke test passed: page loaded, elements present, no console errors.');
    } catch (err) {
        console.error('Smoke test failed:', err.message || err);
        process.exitCode = 1;
    } finally {
        if (browser) await browser.close();
        if (servers && typeof servers.close === 'function') servers.close();
    }
})();
