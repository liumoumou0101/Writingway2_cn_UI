const { chromium } = require('playwright');
const path = require('path');
const { openLatestLegacyProject } = require('./helpers/legacy-app');
const { installLegacyCdnRoutes } = require('./helpers/legacy-cdn-routes');

async function setLegacyAiReady(page) {
    await page.evaluate(() => {
        const root = document.querySelector('[x-data="app"]');
        const app = window.Alpine && typeof window.Alpine.$data === 'function'
            ? window.Alpine.$data(root)
            : (root && root.__x && root.__x.$data ? root.__x.$data : null);
        if (app) app.aiStatus = 'ready';
    });
}

(async () => {
    const projectRoot = path.resolve(__dirname, '..');
    const fileUrl = process.env.APP_URL || ('file:///' + path.join(projectRoot, 'main.html').replace(/\\/g, '/'));

    console.log('Opening:', fileUrl);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    await installLegacyCdnRoutes(context);
    const page = await context.newPage();

    try {
        await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForSelector('.app-container, .welcome-screen', { timeout: 10000 });

        if (!await page.$('.scene-item')) {
            await page.evaluate(async () => {
                const project = { id: Date.now().toString(), name: 'GenRetry', created: new Date(), modified: new Date() };
                const chapter = { id: `${project.id}-c`, projectId: project.id, title: 'Chapter 1', order: 0, created: new Date(), modified: new Date() };
                const scene = { id: `${project.id}-s`, projectId: project.id, chapterId: chapter.id, title: 'Scene 1', order: 0, created: new Date(), modified: new Date() };
                await db.projects.add(project);
                await db.chapters.add(chapter);
                await db.scenes.add(scene);
                await db.content.add({ sceneId: scene.id, text: '', wordCount: 0 });
                try { localStorage.setItem('writingway:lastProject', project.id); } catch (e) { }
            });
            await page.reload({ waitUntil: 'domcontentloaded' });
            await openLatestLegacyProject(page);
            await page.waitForSelector('.scene-item', { timeout: 8000 });
        }

        await page.evaluate(() => {
            window._genCallCount = 0;
            window.Generation = window.Generation || {};
            window.Generation.buildPrompt = window.Generation.buildPrompt || (() => 'PROMPT');
            window.Generation.streamGeneration = async (prompt, onToken) => {
                window._genCallCount = (window._genCallCount || 0) + 1;
                const token = window._genCallCount === 1 ? ' first' : ' retry';
                await new Promise(resolve => setTimeout(resolve, 20));
                onToken(token);
            };
        });

        await setLegacyAiReady(page);
        await page.click('.scene-item');

        const textarea = await page.$('.editor-textarea');
        await page.fill('.beat-input', 'Beat one');
        await page.click('[data-legacy-generate]');
        await page.waitForSelector('[data-legacy-accept-generation]', { state: 'visible', timeout: 5000 });

        const firstValue = await textarea.evaluate(el => el.value);
        if (!firstValue.includes('first')) {
            console.error('First generated token missing:', firstValue.slice(0, 200));
            await browser.close();
            process.exit(3);
        }

        await page.click('[data-legacy-retry-generation]');
        await page.waitForFunction(() => {
            const textarea = document.querySelector('.editor-textarea');
            return (window._genCallCount || 0) >= 2 && textarea && textarea.value.includes('retry');
        }, null, { timeout: 5000 });

        const retryValue = await textarea.evaluate(el => el.value);
        if (!retryValue.includes('retry') || retryValue.includes('first')) {
            console.error('Retry did not replace first generation:', retryValue.slice(0, 200));
            await browser.close();
            process.exit(4);
        }

        await page.click('[data-legacy-accept-generation]');
        await page.waitForSelector('[data-legacy-accept-generation]', { state: 'hidden', timeout: 3000 });
        const acceptedValue = await textarea.evaluate(el => el.value);

        await page.fill('.beat-input', 'Beat two');
        await page.click('[data-legacy-generate]');
        await page.waitForSelector('[data-legacy-discard-generation]', { state: 'visible', timeout: 5000 });
        await page.click('[data-legacy-discard-generation]');
        await page.waitForSelector('[data-legacy-discard-generation]', { state: 'hidden', timeout: 3000 });

        const discardedValue = await textarea.evaluate(el => el.value);
        if (discardedValue !== acceptedValue) {
            console.error('Discard did not restore accepted content:', discardedValue.slice(0, 200));
            await browser.close();
            process.exit(5);
        }

        const beat = await page.$eval('.beat-input', el => el.value);
        if (beat) {
            console.error('Beat input not cleared after discard:', beat);
            await browser.close();
            process.exit(6);
        }

        console.log('UI generation retry/discard test passed.');
        await browser.close();
        process.exit(0);
    } catch (err) {
        console.error('UI generation retry/discard test failed:', err && err.message ? err.message : err);
        await browser.close();
        process.exit(1);
    }
})();
