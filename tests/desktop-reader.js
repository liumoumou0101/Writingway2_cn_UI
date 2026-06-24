const assert = require('assert');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');
const { startDesktopServers } = require('../desktop/local-server');

(async () => {
    const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'writingway-reader-test-'));
    const fixturePath = path.join(dataRoot, 'reader-fixture.md');
    let servers = null;
    let browser = null;

    try {
        await fs.writeFile(
            fixturePath,
            [
                '# 第一章 雾城',
                '',
                '第一段文字。',
                '',
                '第二段文字。',
                '',
                '# 第二章 灯火',
                '',
                '新的章节内容。'
            ].join('\n'),
            'utf8'
        );

        servers = await startDesktopServers({
            appRoot: path.resolve(__dirname, '..'),
            dataRoot,
            revealPath: async () => ''
        });

        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
        await page.goto('http://127.0.0.1:8000/desktop.html', { waitUntil: 'domcontentloaded' });
        await page.click('[data-view-target="reader"]');
        await page.setInputFiles('[data-reader-file]', fixturePath);
        await page.waitForFunction(() => document.querySelector('[data-reader-title]').textContent.includes('第一章 雾城'));

        const initial = await page.evaluate(() => ({
            title: document.querySelector('[data-reader-title]').textContent,
            source: document.querySelector('[data-reader-source]').textContent,
            chapters: Array.from(document.querySelectorAll('.desktop-reader-chapter')).map((item) => item.textContent),
            progress: document.querySelector('[data-reader-progress-percent]').textContent,
            body: document.querySelector('[data-reader-content]').textContent
        }));
        assert.strictEqual(initial.title, '第一章 雾城', 'reader should show the first detected chapter');
        assert.ok(initial.source.includes('reader-fixture'), 'reader should show the imported file title');
        assert.deepStrictEqual(initial.chapters, ['第一章 雾城', '第二章 灯火'], 'reader should detect markdown chapters');
        assert.strictEqual(initial.progress, '50%', 'reader progress should reflect the current chapter');
        assert.ok(initial.body.includes('第一段文字。') && initial.body.includes('第二段文字。'), 'reader should render chapter paragraphs');

        await page.click('[data-reader-next]');
        await page.waitForFunction(() => document.querySelector('[data-reader-title]').textContent.includes('第二章 灯火'));
        assert.strictEqual(await page.locator('[data-reader-progress-percent]').innerText(), '100%', 'reader progress should update on chapter change');

        await page.fill('[data-reader-font-size]', '22');
        await page.fill('[data-reader-line-height]', '2');
        await page.selectOption('[data-reader-theme]', 'paper');
        const settings = await page.evaluate(() => {
            const panel = document.querySelector('[data-reader-theme-panel]');
            return {
                theme: panel.dataset.readerTheme,
                fontSize: panel.style.getPropertyValue('--reader-font-size'),
                lineHeight: panel.style.getPropertyValue('--reader-line-height'),
                saved: JSON.parse(localStorage.getItem('writingway:desktop:reader'))
            };
        });
        assert.strictEqual(settings.theme, 'paper', 'reader theme should apply to the panel');
        assert.strictEqual(settings.fontSize, '22px', 'reader font size should update the panel CSS variable');
        assert.strictEqual(settings.lineHeight, '2', 'reader line height should update the panel CSS variable');
        assert.strictEqual(settings.saved.chapterIndex, 1, 'reader progress should be persisted');
        assert.strictEqual(settings.saved.theme, 'paper', 'reader settings should be persisted');

        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => document.querySelector('[data-reader-title]').textContent.includes('第二章 灯火'));
        assert.strictEqual(await page.locator('[data-reader-progress-percent]').innerText(), '100%', 'reader should restore persisted progress after reload');

        console.log('Desktop reader test passed.');
    } finally {
        if (browser) await browser.close();
        if (servers) servers.close();
        await fs.rm(dataRoot, { recursive: true, force: true });
    }
})().catch((error) => {
    console.error('Desktop reader test failed:', error && error.stack ? error.stack : error);
    process.exit(1);
});
