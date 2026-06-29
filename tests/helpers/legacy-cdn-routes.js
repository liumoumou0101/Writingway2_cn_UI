const fs = require('fs/promises');
const path = require('path');

async function installLegacyCdnRoutes(context) {
    const projectRoot = path.resolve(__dirname, '..', '..');
    const dexiePath = path.join(projectRoot, 'node_modules', 'dexie', 'dist', 'dexie.min.js');
    const jszipPath = path.join(projectRoot, 'node_modules', 'jszip', 'dist', 'jszip.min.js');

    await context.route('https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.min.js', async route => {
        const body = await fs.readFile(dexiePath, 'utf8');
        if (process.env.LEGACY_CDN_DEBUG) {
            console.log('Serving local Dexie for legacy UI test');
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/javascript; charset=utf-8',
            body
        });
    });

    await context.route('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', async route => {
        const body = await fs.readFile(jszipPath, 'utf8');
        if (process.env.LEGACY_CDN_DEBUG) {
            console.log('Serving local JSZip for legacy UI test');
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/javascript; charset=utf-8',
            body
        });
    });
}

module.exports = {
    installLegacyCdnRoutes
};
