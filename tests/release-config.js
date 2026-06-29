const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkg = require('../package.json');

function fileExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

assert.strictEqual(pkg.main, 'desktop/main.js', 'Electron should start from the desktop main process');
assert.ok(fileExists(pkg.main), 'desktop main process should exist');

assert.ok(pkg.build, 'electron-builder config should exist');
assert.strictEqual(pkg.build.asar, false, 'asar should stay disabled until an asar runtime verification exists');

const files = pkg.build.files || [];
for (const required of ['desktop/**/*', 'src/**/*', 'desktop.html', 'main.html', 'package.json']) {
  assert.ok(files.includes(required), `build.files should include ${required}`);
}

assert.ok(pkg.dependencies && pkg.dependencies.jszip, 'jszip is required at runtime by project package import/export');
assert.ok(!((pkg.devDependencies || {}).jszip), 'runtime jszip should not be dev-only');

const desktopMain = fs.readFileSync(path.join(root, 'desktop/main.js'), 'utf8');
assert.ok(desktopMain.includes('http://127.0.0.1:8000/desktop.html'), 'desktop main should load the native desktop entry');

const desktopShell = fs.readFileSync(path.join(root, 'src/desktop/desktop-shell.js'), 'utf8');
assert.ok(
  desktopShell.includes('main.html?runtime=desktop&embedded=writer'),
  'legacy writer should remain an explicit compatibility iframe only'
);

console.log('Release configuration test passed.');
