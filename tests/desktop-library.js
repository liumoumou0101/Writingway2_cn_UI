const assert = require('assert');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');
const { startDesktopServers } = require('../desktop/local-server');

function snapshot(id, name, text, exportedAt) {
    return {
        version: '2.1-desktop-library-test',
        exportedAt,
        filesystemSavedAt: exportedAt,
        project: { id, name, created: exportedAt, modified: exportedAt },
        chapters: [{ id: `${id}-c1`, projectId: id, title: '第一章', order: 0 }],
        scenes: [{ id: `${id}-s1`, projectId: id, chapterId: `${id}-c1`, title: '第一场', order: 0 }],
        sceneContents: { [`${id}-s1`]: text },
        compendium: [],
        prompts: [],
        codex: [],
        promptHistory: [],
        workshopSessions: []
    };
}

(async () => {
    const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'writingway-library-test-'));
    const projectsDir = path.join(dataRoot, 'projects');
    const revealedPaths = [];
    let servers = null;
    let browser = null;

    try {
        await fs.mkdir(projectsDir, { recursive: true });
        await fs.writeFile(
            path.join(projectsDir, '星河长卷--book-1.json'),
            JSON.stringify(snapshot('book-1', '星河长卷', 'alpha beta gamma', '2026-06-23T10:00:00.000Z')),
            'utf8'
        );
        await fs.writeFile(
            path.join(projectsDir, '短篇集--book-2.json'),
            JSON.stringify(snapshot('book-2', '短篇集', 'one two', '2026-06-24T10:00:00.000Z')),
            'utf8'
        );

        servers = await startDesktopServers({
            appRoot: path.resolve(__dirname, '..'),
            dataRoot,
            revealPath: async (targetPath) => {
                revealedPaths.push(targetPath);
                return '';
            }
        });

        const apiResponse = await fetch('http://127.0.0.1:8000/api/list-projects');
        const apiBody = await apiResponse.json();
        assert.ok(apiResponse.ok && apiBody.ok, 'list-projects should return ok');
        assert.strictEqual(apiBody.projects.length, 2, 'API should list two projects');
        assert.strictEqual(apiBody.projects[0].name, '短篇集', 'newest project should be first');
        assert.strictEqual(apiBody.projects[0].wordCount, 2, 'word count should be calculated from sceneContents');

        const projectResponse = await fetch('http://127.0.0.1:8000/api/get-project?projectId=book-2');
        const projectBody = await projectResponse.json();
        assert.ok(projectResponse.ok && projectBody.ok, 'get-project should return ok');
        assert.strictEqual(projectBody.project.project.name, '短篇集', 'get-project should return the snapshot payload');

        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage({ viewport: { width: 1366, height: 850 } });
        await page.goto('http://127.0.0.1:8000/desktop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => document.querySelectorAll('.desktop-project-card').length === 2);

        await page.evaluate(() => {
            window.__fullscreenClicked = false;
            window.writingwayDesktop = {
                toggleFullscreen: async () => {
                    window.__fullscreenClicked = true;
                    return true;
                }
            };
        });
        await page.click('[data-toggle-fullscreen]');
        assert.strictEqual(await page.evaluate(() => window.__fullscreenClicked), true, 'fullscreen button should call desktop API');

        let cardText = await page.locator('.desktop-project-card').first().innerText();
        assert.ok(cardText.includes('短篇集'), 'first card should render project name');
        assert.ok(cardText.includes('2 字'), 'first card should render word count');

        await page.locator('.desktop-mini-action').first().click();
        await page.fill('[data-project-edit-name]', '短篇集修订版');
        await page.selectOption('[data-project-edit-status]', '修订中');
        await page.fill('[data-project-edit-tags]', '短篇, 测试');
        await page.fill('[data-project-edit-description]', '这是一个用于桌面书库测试的简介。');
        await page.locator('[data-project-edit-form] button[type="submit"]').click();
        await page.waitForFunction(() => document.body.innerText.includes('短篇集修订版'));

        const updatedProjectResponse = await fetch('http://127.0.0.1:8000/api/get-project?projectId=book-2');
        const updatedProjectBody = await updatedProjectResponse.json();
        assert.ok(updatedProjectResponse.ok && updatedProjectBody.ok, 'edited project should remain readable');
        assert.strictEqual(updatedProjectBody.project.project.name, '短篇集修订版', 'project metadata edit should rename the project');
        assert.strictEqual(updatedProjectBody.project.project.status, '修订中', 'project metadata edit should save status');
        assert.deepStrictEqual(updatedProjectBody.project.project.tags, ['短篇', '测试'], 'project metadata edit should save tags');
        assert.strictEqual(updatedProjectBody.project.project.description, '这是一个用于桌面书库测试的简介。', 'project metadata edit should save description');

        await page.selectOption('[data-project-sort]', 'words');
        const wordSortedText = await page.locator('.desktop-project-card').first().innerText();
        assert.ok(wordSortedText.includes('星河长卷'), 'word sort should put the longest project first');

        await page.fill('[data-project-search]', '短篇');
        await page.waitForFunction(() => document.querySelectorAll('.desktop-project-card').length === 1);
        const filteredText = await page.locator('.desktop-project-card').first().innerText();
        assert.ok(filteredText.includes('短篇集修订版'), 'search should filter project cards by name');
        assert.ok(filteredText.includes('修订中'), 'project card should show edited status');
        assert.ok(filteredText.includes('桌面书库测试'), 'project card should show edited description');

        await page.evaluate(() => {
            Object.defineProperty(navigator, 'clipboard', {
                configurable: true,
                value: {
                    writeText: async (text) => {
                        window.__copiedProjectPath = text;
                    }
                }
            });
        });
        await page.locator('.desktop-mini-action', { hasText: '复制路径' }).first().click();
        const copiedPath = await page.evaluate(() => window.__copiedProjectPath);
        assert.ok(copiedPath && copiedPath.includes('book-2.json'), 'copy path should use the project snapshot path');

        await page.locator('.desktop-mini-action', { hasText: '定位文件' }).first().click();
        await page.waitForFunction(() => document.body.innerText.includes('已在文件管理器中定位项目文件'));
        assert.strictEqual(revealedPaths.length, 1, 'reveal project file should call the desktop reveal hook');
        assert.ok(revealedPaths[0].includes('book-2.json'), 'revealed path should point at the edited project snapshot');

        await page.locator('.desktop-project-card').first().click();
        await page.waitForFunction(() => {
            const frame = document.getElementById('legacy-writer-frame');
            const writerWindow = frame && frame.contentWindow;
            const writerDocument = frame && frame.contentDocument;
            const root = writerDocument && writerDocument.querySelector('[x-data="app"]');
            if (!writerWindow || !writerWindow.Alpine || !root) return false;
            const app = writerWindow.Alpine.$data(root);
            return app.currentProject && app.currentProject.id === 'book-2' && app.currentProject.name === '短篇集修订版';
        }, { timeout: 12000 });

        await page.click('[data-view-target="bookshelf"]');
        await page.waitForFunction(() => document.querySelectorAll('.desktop-project-card').length === 1);
        page.once('dialog', async (dialog) => {
            await dialog.accept();
        });
        await page.locator('.desktop-mini-action-danger').first().click();
        await page.waitForFunction(() => document.querySelectorAll('.desktop-project-card').length === 0);

        const removedListResponse = await fetch('http://127.0.0.1:8000/api/list-projects');
        const removedListBody = await removedListResponse.json();
        assert.ok(removedListResponse.ok && removedListBody.ok, 'project list should remain readable after remove');
        assert.strictEqual(removedListBody.projects.some((project) => project.id === 'book-2'), false, 'removed project should leave the active library');
        const removedFiles = await fs.readdir(path.join(projectsDir, '.removed-projects'));
        assert.ok(removedFiles.some((file) => file.includes('book-2.json')), 'removed project should be moved to the recovery folder');

        await page.fill('[data-project-search]', '');
        await page.waitForFunction(() => document.querySelectorAll('.desktop-project-card').length === 1);
        await page.click('[data-open-new-project]');
        await page.fill('[data-project-create-name]', 'Desktop Draft');
        await page.fill('[data-project-create-tags]', 'desktop, draft');
        await page.fill('[data-project-create-description]', 'Created from the native desktop library.');
        await page.locator('[data-project-create-form] button[type="submit"]').click();
        await page.waitForFunction(() => {
            const frame = document.getElementById('legacy-writer-frame');
            const writerWindow = frame && frame.contentWindow;
            const writerDocument = frame && frame.contentDocument;
            const root = writerDocument && writerDocument.querySelector('[x-data="app"]');
            if (!writerWindow || !writerWindow.Alpine || !root) return false;
            const app = writerWindow.Alpine.$data(root);
            return app.currentProject && app.currentProject.name === 'Desktop Draft';
        }, { timeout: 12000 });

        const createdListResponse = await fetch('http://127.0.0.1:8000/api/list-projects');
        const createdListBody = await createdListResponse.json();
        assert.ok(createdListResponse.ok && createdListBody.ok, 'project list should remain readable after create');
        assert.ok(createdListBody.projects.some((project) => project.name === 'Desktop Draft'), 'created project should be saved to the desktop library');

        await page.evaluate(() => {
            window.postMessage({
                type: 'writingway:desktop:project-saved',
                snapshot: {
                    project: { id: 'saved-project', name: 'Saved Story' },
                    chapters: [{ id: 'saved-chapter', projectId: 'saved-project', title: 'Saved Chapter', order: 0 }],
                    scenes: [{ id: 'saved-scene', projectId: 'saved-project', chapterId: 'saved-chapter', title: 'Saved Scene', order: 0 }],
                    sceneContents: { 'saved-scene': 'Freshly saved generated prose.' },
                    exportedAt: new Date().toISOString()
                },
                result: { ok: true }
            }, window.location.origin);
        });
        await page.click('[data-view-target="reader"]');
        await page.waitForFunction(() => document.querySelector('[data-reader-title]').textContent === 'Saved Chapter');
        const savedReaderText = await page.locator('[data-reader-content]').innerText();
        assert.ok(savedReaderText.includes('Freshly saved generated prose.'), 'reader should refresh from the last saved project snapshot');

        console.log('Desktop project library test passed.');
    } finally {
        if (browser) await browser.close();
        if (servers) servers.close();
        await fs.rm(dataRoot, { recursive: true, force: true });
    }
})().catch((error) => {
    console.error('Desktop project library test failed:', error && error.stack ? error.stack : error);
    process.exit(1);
});
