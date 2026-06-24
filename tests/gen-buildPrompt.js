const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const projectRoot = path.resolve(__dirname, '..');
    const fileUrl = process.env.APP_URL || ('file:///' + path.join(projectRoot, 'main.html').replace(/\\/g, '/'));

    console.log('Opening:', fileUrl);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto(fileUrl, { waitUntil: 'load', timeout: 15000 });

        // Wait for Generation to be available
        await page.waitForFunction(() => window.Generation && typeof window.Generation.buildPrompt === 'function', { timeout: 5000 });

        const beat = "She grabs her coat and steps into the rain.";
        const sceneContext = "Alice sat by the window, watching the streetlights.";
        const options = { povCharacter: 'Alice', pov: '1st person', tense: 'present' };

        const promptText = await page.evaluate(({ b, s, o }) => {
            const prompt = window.Generation.buildPrompt(b, s, o);
            return typeof prompt === 'object' && prompt.asString
                ? prompt.asString()
                : String(prompt);
        }, { b: beat, s: sceneContext, o: options });

        console.log('Generated prompt preview (first 200 chars):', promptText.slice(0, 200).replace(/\n/g, '\\n'));

        const checks = [
            { ok: promptText.includes('Alice'), msg: 'POV character not found' },
            { ok: promptText.includes('present tense'), msg: 'tense text not found' },
            { ok: promptText.includes('1st person'), msg: 'POV text not found' },
            { ok: promptText.includes('BEAT TO EXPAND') || promptText.includes('BEAT TO EXPAND:'), msg: 'beat marker missing' },
            { ok: promptText.includes('She grabs her coat'), msg: 'beat content not included' }
        ];

        const failed = checks.filter(c => !c.ok);
        if (failed.length > 0) {
            console.error('Unit test failed:');
            for (const f of failed) console.error(' -', f.msg);
            await browser.close();
            process.exit(2);
        }

        console.log('Generation.buildPrompt unit test passed.');
        await browser.close();
        process.exit(0);
    } catch (err) {
        console.error('Unit test failed:', err.message || err);
        await browser.close();
        process.exit(1);
    }
})();
