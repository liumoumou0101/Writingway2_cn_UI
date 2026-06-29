const assert = require('assert');
const { spawn } = require('child_process');
const fs = require('fs/promises');
const http = require('http');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const exePath = path.join(root, 'release', 'win-unpacked', 'Writingway.exe');
const baseUrl = 'http://127.0.0.1:8000';

function request(method, pathname, body) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : Buffer.from(JSON.stringify(body));
    const req = http.request(`${baseUrl}${pathname}`, {
      method,
      headers: data ? {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      } : {}
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {
          json = null;
        }
        resolve({ status: res.statusCode, text, json });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function waitForDesktop(timeoutMs = 30000) {
  const start = Date.now();
  let lastError = null;
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await request('GET', '/desktop.html');
      if (response.status >= 200 && response.status < 500 && response.text.includes('desktop-root')) {
        return;
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Packaged app did not become reachable: ${lastError ? lastError.message : 'timeout'}`);
}

async function assertPortFree() {
  try {
    await request('GET', '/desktop.html');
  } catch {
    return;
  }
  throw new Error('Port 8000 is already in use. Close the running Writingway/dev server before packaged smoke.');
}

function killProcess(child) {
  return new Promise((resolve) => {
    if (!child || child.killed) {
      resolve();
      return;
    }
    child.once('exit', () => resolve());
    child.kill();
    setTimeout(() => {
      if (!child.killed) child.kill('SIGKILL');
      resolve();
    }, 3000).unref();
  });
}

(async () => {
  await fs.access(exePath);
  await assertPortFree();
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'writingway-packaged-smoke-'));
  let child = null;

  try {
    child = spawn(exePath, [], {
      cwd: path.dirname(exePath),
      env: {
        ...process.env,
        WRITINGWAY_DATA_ROOT: dataRoot
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    await waitForDesktop();

    const listBefore = await request('GET', '/api/list-projects');
    assert.ok(listBefore.status === 200 && listBefore.json && listBefore.json.ok, 'packaged app should list projects');
    assert.ok(String(listBefore.json.projectSaveLocation || '').startsWith(path.join(dataRoot, 'projects')), 'packaged app should use test data root');

    const created = await request('POST', '/api/create-project', {
      metadata: {
        name: 'Packaged Smoke Project',
        description: 'Created by packaged smoke test.'
      }
    });
    assert.ok(created.status === 200 && created.json && created.json.ok, `create-project failed: ${created.text}`);
    const projectId = created.json.project.project.id;
    const sceneId = created.json.project.scenes[0].id;
    const chapterId = created.json.project.chapters[0].id;
    created.json.project.sceneContents[sceneId] = 'Packaged persistence line.';
    created.json.project.scenes[0].title = 'Packaged Scene';
    created.json.project.currentSceneId = sceneId;
    created.json.project.currentChapterId = chapterId;

    const saved = await request('POST', '/api/save-project', created.json.project);
    assert.ok(saved.status === 200 && saved.json && saved.json.ok, `save-project failed: ${saved.text}`);

    const reopened = await request('GET', `/api/get-project?projectId=${encodeURIComponent(projectId)}`);
    assert.ok(reopened.status === 200 && reopened.json && reopened.json.ok, 'saved project should reopen');
    assert.ok(
      Object.values(reopened.json.project.sceneContents || {}).some((content) => String(content).includes('Packaged persistence line.')),
      'saved project content should persist in packaged app data root'
    );

    const backup = await request('POST', '/api/create-backup', {
      ...reopened.json.project,
      backupRequest: {
        reason: 'packaged-smoke',
        note: 'Packaged smoke backup.'
      }
    });
    assert.ok(backup.status === 200 && backup.json && backup.json.ok, `save-local-backup failed: ${backup.text}`);

    const backups = await request('GET', `/api/list-backups?projectId=${encodeURIComponent(projectId)}`);
    assert.ok(backups.status === 200 && backups.json && backups.json.ok, 'packaged app should list backups');
    assert.ok(backups.json.backups.some((item) => item.reason === 'packaged-smoke'), 'packaged backup should be visible');

    console.log('Packaged smoke test passed.');
  } catch (error) {
    if (child && child.exitCode !== null) {
      error.message += `\nPackaged process exited early with code ${child.exitCode}.`;
    }
    throw error;
  } finally {
    await killProcess(child);
    await fs.rm(dataRoot, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error('Packaged smoke test failed:', error && error.stack ? error.stack : error);
  process.exit(1);
});
