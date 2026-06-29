const { spawn } = require('child_process');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { startDesktopServers } = require('../desktop/local-server');

const tests = [
    'ui-generation.js',
    'ui-generation-retry.js',
    'ui-move-scene.js',
    'ui-sidebar.js'
];

function runNodeTest(testFile, env) {
    return new Promise(resolve => {
        const child = spawn(process.execPath, [path.join(__dirname, testFile)], {
            cwd: path.resolve(__dirname, '..'),
            env,
            stdio: 'inherit'
        });

        child.on('error', error => {
            console.error(`Failed to start ${testFile}:`, error && error.message ? error.message : error);
            resolve(1);
        });
        child.on('exit', code => {
            resolve(code === null ? 1 : code);
        });
    });
}

(async () => {
    const projectRoot = path.resolve(__dirname, '..');
    let servers = null;
    let dataRoot = null;
    const appUrl = process.env.APP_URL || 'http://127.0.0.1:8000/main.html';
    const env = { ...process.env, APP_URL: appUrl };

    try {
        if (!process.env.APP_URL) {
            dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'writingway-legacy-ui-'));
            servers = await startDesktopServers({
                appRoot: projectRoot,
                dataRoot,
                chooseBackupFolder: null,
                chooseProjectSaveFolder: null,
                openPath: null,
                revealPath: null
            });
        }

        for (const testFile of tests) {
            const status = await runNodeTest(testFile, env);
            if (status !== 0) {
                process.exitCode = status;
                return;
            }
        }
    } catch (error) {
        console.error('Legacy UI test runner failed:', error && error.message ? error.message : error);
        process.exitCode = 1;
    } finally {
        if (servers && typeof servers.close === 'function') {
            servers.close();
        }
    }
})();
