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

        servers = await startDesktopServers({ appRoot: path.resolve(__dirname, '..'), dataRoot });

        const apiResponse = await fetch('http://127.0.0.1:8000/api/list-projects');
        const apiBody = await apiResponse.json();
        assert.ok(apiResponse.ok && apiBody.ok, 'list-projects should return ok');
        assert.strictEqual(apiBody.projects.length, 2, 'API should list two projects');
        assert.strictEqual(apiBody.projects[0].name, '短篇集', 'newest project should be first');
        assert.strictEqual(apiBody.projects[0].wordCount, 2, 'word count should be calculated from sceneContents');

        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage({ viewport: { width: 1366, height: 850 } });
        await page.goto('http://127.0.0.1:8000/desktop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => document.querySelectorAll('.desktop-project-card').length === 2);

        const cardText = await page.locator('.desktop-project-card').first().innerText();
        assert.ok(cardText.includes('短篇集'), 'first card should render project name');
        assert.ok(cardText.includes('2 字'), 'first card should render word count');

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
