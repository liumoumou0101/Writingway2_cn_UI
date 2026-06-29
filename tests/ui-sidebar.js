const { chromium } = require('playwright');
const path = require('path');
const { openLatestLegacyProject } = require('./helpers/legacy-app');
const { installLegacyCdnRoutes } = require('./helpers/legacy-cdn-routes');

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

        // Wait for app to render
        await page.waitForSelector('.app-container, .welcome-screen', { timeout: 10000 });

        // If no chapter exists after a short wait, seed a test project directly into Dexie and reload
        let hasChapter = await page.$('.chapter-item');
        if (!hasChapter) {
            try {
                // Wait briefly for app to possibly load chapters
                await page.waitForTimeout(800);
                hasChapter = await page.$('.chapter-item');
            } catch (e) { }
        }

        if (!hasChapter) {
            // Seed a project/chapter/scene directly using the page's Dexie `db` instance
            await page.evaluate(async () => {
                try {
                    const proj = { id: Date.now().toString(), name: 'AutoTest Project', created: new Date(), modified: new Date() };
                    await db.projects.add(proj);
                    const chap = { id: Date.now().toString() + '-c', projectId: proj.id, title: 'Chapter 1', order: 0, created: new Date(), modified: new Date() };
                    await db.chapters.add(chap);
                    const scene = { id: Date.now().toString() + '-s', projectId: proj.id, chapterId: chap.id, title: 'Scene 1', order: 0, created: new Date(), modified: new Date() };
                    await db.scenes.add(scene);
                    await db.content.add({ sceneId: scene.id, text: '', wordCount: 0 });
                    try { localStorage.setItem('writingway:lastProject', proj.id); } catch (e) { }
                } catch (err) {
                    // ignore
                }
            });

            // Reload the page so Alpine picks up the new project state
            await page.reload({ waitUntil: 'domcontentloaded' });
            // Debug: log current DB counts from the page context
            const counts = await page.evaluate(async () => {
                try {
                    const projects = await db.projects.toArray();
                    const chapters = await db.chapters.toArray();
                    const scenes = await db.scenes.toArray();
                    return { projects: projects.length, chapters: chapters.length, scenes: scenes.length };
                } catch (e) {
                    return { error: String(e) };
                }
            });
            console.log('DB counts after seeding:', counts);
            await openLatestLegacyProject(page);
            await page.waitForSelector('.chapter-item', { timeout: 8000 }).catch(() => { });
        }

        // Grab the first chapter item
        const firstChapter = await page.$('.chapter-item');
        if (!firstChapter) {
            console.error('No chapter items found after setup');
            await browser.close();
            process.exit(3);
        }

        const header = await firstChapter.$('.chapter-header');
        const scenes = await firstChapter.$('.chapter-scenes');

        if (!header || !scenes) {
            console.error('Expected chapter header and scenes elements to be present');
            await browser.close();
            process.exit(4);
        }

        if (!await scenes.isVisible()) {
            console.error('Chapter scenes are not visible after opening the project');
            await browser.close();
            process.exit(5);
        }

        const firstScene = await firstChapter.$('.scene-item');
        if (!firstScene) {
            console.error('Expected at least one scene item in the chapter');
            await browser.close();
            process.exit(6);
        }

        await firstScene.click();
        await page.waitForSelector('.scene-item.active', { timeout: 3000 });

        console.log('UI sidebar test passed: chapter and scene list renders and scene selection works.');
        await browser.close();
        process.exit(0);
    } catch (err) {
        console.error('UI sidebar test failed:', err && err.message ? err.message : err);
        await browser.close();
        process.exit(1);
    }
})();
