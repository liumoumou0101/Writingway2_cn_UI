const { execFile } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const fsp = require('fs/promises');
const http = require('http');
const https = require('https');
const os = require('os');
const path = require('path');
const { URL } = require('url');

const HOST = '127.0.0.1';
const APP_PORT = 8000;
const UPDATER_PORT = 8001;
const REPO_OWNER = 'liumoumou0101';
const REPO_NAME = 'Writingway2_cn_UI';
const BRANCH = 'main';
const LLAMA_RELEASE_API = 'https://api.github.com/repos/ggml-org/llama.cpp/releases/latest';

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp'
};

function sanitizeFilename(value) {
  const safe = String(value || '')
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[ .]+$/g, '');
  return (safe.slice(0, 80) || 'project');
}

function projectFilename(project) {
  const projectId = String(project.id || '').trim();
  if (!projectId) {
    throw new Error('Project id is required');
  }
  return `${sanitizeFilename(project.name || 'project')}--${projectId}.json`;
}

function backupFilename(project, exportedAt) {
  const projectId = String(project.id || '').trim();
  if (!projectId) {
    throw new Error('Project id is required');
  }
  const timestamp = String(exportedAt || new Date().toISOString())
    .replace(/:/g, '-')
    .replace(/\./g, '-')
    .replace('+00:00', 'Z');
  return `${timestamp}--${sanitizeFilename(project.name || 'project')}--${sanitizeFilename(projectId)}.json`;
}

function settingsPath(dataRoot) {
  return path.join(dataRoot, '.writingway-settings.json');
}

async function readSettings(dataRoot) {
  try {
    return JSON.parse(await fsp.readFile(settingsPath(dataRoot), 'utf8'));
  } catch {
    return {};
  }
}

async function writeSettings(dataRoot, settings) {
  await writeJsonAtomic(settingsPath(dataRoot), settings);
}

async function backupRoot(dataRoot) {
  const settings = await readSettings(dataRoot);
  return settings.backupLocation || path.join(await projectSaveRoot(dataRoot), 'backups');
}

async function projectSaveRoot(dataRoot) {
  const settings = await readSettings(dataRoot);
  return settings.projectSaveLocation || path.join(dataRoot, 'projects');
}

async function backupDir(dataRoot, projectId) {
  return path.join(await backupRoot(dataRoot), sanitizeFilename(projectId));
}

function legacyBackupRoot(dataRoot) {
  return path.join(dataRoot, 'project-backups');
}

async function backupSearchRoots(dataRoot) {
  const roots = [await backupRoot(dataRoot), legacyBackupRoot(dataRoot)];
  return Array.from(new Set(roots.map((root) => path.resolve(root))));
}

async function findBackupFile(dataRoot, projectId, backupId) {
  for (const root of await backupSearchRoots(dataRoot)) {
    const filePath = path.join(root, sanitizeFilename(projectId), backupId);
    if (await pathExists(filePath)) {
      const stats = await fsp.stat(filePath);
      return { root, dir: path.dirname(filePath), filePath, name: backupId, stats };
    }
  }
  return null;
}

function jsonResponse(response, statusCode, payload, cors = false) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8');
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    ...(cors ? corsHeaders() : {})
  });
  response.end(body);
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

async function readJsonPayload(request) {
  const body = await readBody(request);
  if (body.length === 0) {
    throw new Error('Request body is required');
  }
  return JSON.parse(body.toString('utf8'));
}

async function writeJsonAtomic(filePath, payload) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = path.join(path.dirname(filePath), `${path.basename(filePath)}.${crypto.randomUUID()}.tmp`);
  await fsp.writeFile(tempPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await fsp.rename(tempPath, filePath);
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function snapshotHash(payload) {
  const clone = JSON.parse(JSON.stringify(payload));
  delete clone.backupRequest;
  delete clone.backupMeta;
  delete clone.localBackupSavedAt;
  delete clone.localBackupVersion;
  return crypto.createHash('sha256').update(stableStringify(clone)).digest('hex');
}

function snapshotStats(payload) {
  const sceneContents = payload.sceneContents || {};
  const wordCount = Object.values(sceneContents).reduce((total, text) => {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean);
    return total + words.length;
  }, 0);
  return {
    chapterCount: Array.isArray(payload.chapters) ? payload.chapters.length : 0,
    sceneCount: Array.isArray(payload.scenes) ? payload.scenes.length : 0,
    wordCount
  };
}

async function readProjectSummary(dataRoot, file) {
  let payload = {};
  let parseError = '';
  try {
    payload = JSON.parse(await fsp.readFile(file.filePath, 'utf8'));
  } catch (error) {
    parseError = error.message || 'Invalid JSON';
    payload = {};
  }

  const project = payload.project || {};
  const stats = snapshotStats(payload);
  const projectId = project.id ? String(project.id) : path.basename(file.name, '.json');
  const timestamp = payload.filesystemSavedAt || payload.exportedAt || project.modified || file.stats.mtime.toISOString();

  return {
    id: projectId,
    name: project.name ? String(project.name) : path.basename(file.name, '.json'),
    description: typeof project.description === 'string' ? project.description : '',
    status: typeof project.status === 'string' ? project.status : '',
    tags: Array.isArray(project.tags) ? project.tags.filter((tag) => typeof tag === 'string').slice(0, 20) : [],
    coverImage: typeof project.coverImage === 'string' ? project.coverImage : '',
    created: project.created || '',
    modified: project.modified || '',
    timestamp,
    absolutePath: file.filePath,
    path: path.relative(await projectSaveRoot(dataRoot), file.filePath).replace(/\\/g, '/'),
    filename: file.name,
    size: file.stats.size,
    chapterCount: stats.chapterCount,
    sceneCount: stats.sceneCount,
    wordCount: stats.wordCount,
    health: parseError ? 'invalid' : 'ok',
    healthMessage: parseError
  };
}

function normalizeProjectMetadata(payload) {
  const metadata = payload && typeof payload === 'object' ? payload : {};
  const name = String(metadata.name || '').trim();
  if (!name) {
    throw new Error('Project name is required');
  }

  const tags = Array.isArray(metadata.tags)
    ? metadata.tags
    : String(metadata.tags || '').split(',');

  return {
    name: name.slice(0, 120),
    description: String(metadata.description || '').trim().slice(0, 2000),
    status: String(metadata.status || '').trim().slice(0, 40),
    tags: tags
      .map((tag) => String(tag || '').trim())
      .filter(Boolean)
      .slice(0, 20),
    coverImage: String(metadata.coverImage || '').trim().slice(0, 4000000)
  };
}

async function listProjectFiles(dataRoot) {
  const root = await projectSaveRoot(dataRoot);
  try {
    const entries = await fsp.readdir(root, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.json')) continue;
      const filePath = path.join(root, entry.name);
      files.push({ filePath, name: entry.name, stats: await fsp.stat(filePath) });
    }
    return files.sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs);
  } catch {
    return [];
  }
}

async function findProjectFile(dataRoot, projectId, filename) {
  const files = await listProjectFiles(dataRoot);
  const requestedFilename = filename ? path.basename(filename) : '';
  if (requestedFilename) {
    return files.find((file) => file.name === requestedFilename) || null;
  }

  const requestedProjectId = String(projectId || '').trim();
  if (!requestedProjectId) return null;

  for (const file of files) {
    try {
      const payload = JSON.parse(await fsp.readFile(file.filePath, 'utf8'));
      if (payload.project && String(payload.project.id) === requestedProjectId) return file;
    } catch {
      // Ignore unreadable files while looking for a matching project.
    }
  }
  return null;
}

function createProjectSnapshot(metadata) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const chapterId = `${id}-chapter-1`;
  const sceneId = `${id}-scene-1`;
  const project = {
    id,
    name: metadata.name,
    description: metadata.description || '',
    status: metadata.status || '',
    tags: metadata.tags || [],
    coverImage: metadata.coverImage || '',
    created: now,
    modified: now,
    updatedAt: Date.now()
  };

  return {
    version: '2.1-desktop',
    exportedAt: now,
    filesystemSavedAt: now,
    filesystemSaveVersion: 1,
    project,
    chapters: [{
      id: chapterId,
      projectId: id,
      title: '第一章',
      order: 0,
      created: now,
      modified: now,
      updatedAt: Date.now()
    }],
    scenes: [{
      id: sceneId,
      projectId: id,
      chapterId,
      title: '第一场',
      order: 0,
      created: now,
      modified: now,
      updatedAt: Date.now()
    }],
    sceneContents: {
      [sceneId]: ''
    },
    compendium: [],
    prompts: [],
    codex: [],
    promptHistory: [],
    workshopSessions: []
  };
}

async function uniqueFilePath(dir, filename) {
  let target = path.join(dir, filename);
  if (!(await pathExists(target))) return target;

  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let index = 2;
  while (await pathExists(target)) {
    target = path.join(dir, `${base}-${index}${ext}`);
    index += 1;
  }
  return target;
}

async function listBackupFiles(dataRoot, projectId = '') {
  const dirs = [];
  for (const root of await backupSearchRoots(dataRoot)) {
    if (projectId) {
      dirs.push({ root, dir: path.join(root, sanitizeFilename(projectId)) });
      continue;
    }
    try {
      const entries = await fsp.readdir(root, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) dirs.push({ root, dir: path.join(root, entry.name) });
      }
    } catch {
      // This backup root may not exist yet.
    }
  }

  const files = [];
  const seen = new Set();
  for (const { root, dir } of dirs) {
    try {
      const entries = await fsp.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.json')) {
          const filePath = path.join(dir, entry.name);
          const key = path.resolve(filePath).toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          files.push({ root, dir, filePath, name: entry.name, stats: await fsp.stat(filePath) });
        }
      }
    } catch {
      // No backups for this project yet.
    }
  }
  return files.sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs);
}

async function readBackupSummary(dataRoot, file) {
  let payload = {};
  let parseError = '';
  try {
    payload = JSON.parse(await fsp.readFile(file.filePath, 'utf8'));
  } catch (error) {
    parseError = error.message || 'Invalid JSON';
    payload = {};
  }
  const meta = payload.backupMeta || {};
  const stats = snapshotStats(payload);
  const healthy = !parseError && !!(payload.project && payload.project.id) && Array.isArray(payload.chapters) && Array.isArray(payload.scenes) && !!payload.sceneContents;
  return {
    id: file.name,
    projectId: payload.project && payload.project.id ? String(payload.project.id) : '',
    projectName: payload.project && payload.project.name ? String(payload.project.name) : '',
    timestamp: meta.createdAt || file.stats.mtime.toISOString(),
    path: path.relative(file.root || await backupRoot(dataRoot), file.filePath).replace(/\\/g, '/'),
    size: file.stats.size,
    reason: meta.reason || 'manual',
    note: meta.note || '',
    pinned: !!meta.pinned,
    hash: meta.hash || '',
    chapterCount: meta.chapterCount || stats.chapterCount,
    sceneCount: meta.sceneCount || stats.sceneCount,
    wordCount: meta.wordCount || stats.wordCount,
    health: healthy ? 'ok' : 'invalid',
    healthMessage: healthy ? '' : (parseError || 'Backup is missing required project data')
  };
}

async function backupIsPinned(dataRoot, file) {
  try {
    const summary = await readBackupSummary(dataRoot, file);
    return !!summary.pinned;
  } catch {
    return false;
  }
}

async function pruneBackups(dataRoot, projectId, retention) {
  const mode = retention && retention.mode ? retention.mode : 'count';
  if (mode === 'all') return 0;

  const files = await listBackupFiles(dataRoot, projectId);
  const unpinnedFiles = [];
  for (const file of files) {
    if (!(await backupIsPinned(dataRoot, file))) {
      unpinnedFiles.push(file);
    }
  }

  let toDelete = [];
  if (mode === 'days') {
    const days = Math.max(1, Number(retention.days || 30));
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    toDelete = unpinnedFiles.filter((file) => file.stats.mtimeMs < cutoff);
  } else {
    const count = Math.max(1, Number(retention && retention.count || 100));
    toDelete = unpinnedFiles.slice(count);
  }

  for (const file of toDelete) {
    await fsp.rm(file.filePath, { force: true });
  }
  return toDelete.length;
}

function runtimePlatform() {
  const platformMap = {
    darwin: 'macos',
    win32: 'windows'
  };
  const archMap = {
    x64: 'x64',
    arm64: 'arm64'
  };
  return {
    platformId: platformMap[process.platform] || process.platform,
    arch: archMap[process.arch] || process.arch
  };
}

function llamaServerFilename() {
  return runtimePlatform().platformId === 'windows' ? 'llama-server.exe' : 'llama-server';
}

async function pathExists(filePath) {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findGgufModels(rootDir) {
  const modelsDir = path.join(rootDir, 'models');
  try {
    const entries = await fsp.readdir(modelsDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.gguf'))
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

function llamaInstallChoices(platformId, arch) {
  if (!['windows', 'linux', 'macos'].includes(platformId) || !['x64', 'arm64'].includes(arch)) {
    return [];
  }

  const choices = [
    { id: 'cpu', label: 'CPU', description: 'Runs on the CPU. Slowest, but works on most systems.' }
  ];

  if (platformId === 'windows' && arch === 'x64') {
    choices.push({
      id: 'cuda',
      label: 'NVIDIA GPU (CUDA)',
      description: 'Use this if you have an NVIDIA GPU with CUDA drivers installed.'
    });
  }

  return choices;
}

async function runtimeInfo(dataRoot) {
  const { platformId, arch } = runtimePlatform();
  const ggufModels = await findGgufModels(dataRoot);
  const llamaPath = path.join(dataRoot, 'llama', llamaServerFilename());
  const hasLlamaServer = await pathExists(llamaPath);
  const installChoices = llamaInstallChoices(platformId, arch);

  return {
    ok: true,
    platform: platformId,
    arch,
    hasGGUFModels: ggufModels.length > 0,
    ggufModels,
    hasLlamaServer,
    llamaServerPath: path.relative(dataRoot, llamaPath).replace(/\\/g, '/'),
    localAIAvailable: hasLlamaServer && ggufModels.length > 0,
    llamaSetupRecommended: ggufModels.length > 0 && !hasLlamaServer && installChoices.length > 0,
    llamaInstallChoices: installChoices
  };
}

function requestJson(url) {
  return downloadBuffer(url, {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Writingway/2.0'
  }).then((buffer) => JSON.parse(buffer.toString('utf8')));
}

function downloadBuffer(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const request = client.get(url, { headers }, (response) => {
      const statusCode = response.statusCode || 0;
      if ([301, 302, 303, 307, 308].includes(statusCode) && response.headers.location) {
        response.resume();
        const nextUrl = new URL(response.headers.location, url).toString();
        downloadBuffer(nextUrl, headers).then(resolve, reject);
        return;
      }
      if (statusCode < 200 || statusCode >= 300) {
        response.resume();
        reject(new Error(`Download failed with HTTP ${statusCode}`));
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    });
    request.setTimeout(120000, () => {
      request.destroy(new Error('Download timed out'));
    });
    request.on('error', reject);
  });
}

async function downloadFile(url, destination, headers = {}) {
  const buffer = await downloadBuffer(url, headers);
  await fsp.mkdir(path.dirname(destination), { recursive: true });
  await fsp.writeFile(destination, buffer);
  return buffer.length;
}

function selectLlamaAsset(assets, platformId, arch, variant) {
  const excludedGpuTerms = ['vulkan', 'rocm', 'openvino', 'sycl', 'hip'];
  const scored = [];

  for (const asset of assets) {
    const name = String(asset.name || '').toLowerCase();
    if (!name || !(name.endsWith('.zip') || name.endsWith('.tar.gz') || name.endsWith('.tgz'))) {
      continue;
    }

    let score = 0;
    if (platformId === 'windows') {
      if (!name.includes('win') || !name.includes(arch)) continue;
      score += 20;
      if (variant === 'cuda') {
        if (!name.includes('cuda')) continue;
        score += 20;
        if (name.includes('cudart')) score += 5;
      } else {
        if (name.includes('cuda') || excludedGpuTerms.some((term) => name.includes(term))) continue;
        score += 10;
      }
    } else if (platformId === 'linux') {
      if (!['ubuntu', 'linux'].some((term) => name.includes(term)) || !name.includes(arch)) continue;
      if (variant !== 'cpu') continue;
      if (excludedGpuTerms.some((term) => name.includes(term))) continue;
      score += 30;
    } else if (platformId === 'macos') {
      if (!name.includes('macos') || !name.includes(arch)) continue;
      if (variant !== 'cpu') continue;
      score += 30;
    } else {
      continue;
    }

    if (name.includes('server')) score += 3;
    if (name.endsWith('.zip')) score += 1;
    scored.push({ score, asset });
  }

  if (scored.length === 0) {
    throw new Error(`Could not find a llama.cpp asset for ${platformId}/${arch} (${variant}).`);
  }

  scored.sort((a, b) => b.score - a.score || String(a.asset.name).length - String(b.asset.name).length);
  return scored[0].asset;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { windowsHide: true, ...options }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function extractArchive(archivePath, targetDir) {
  const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'writingway-llama-'));
  try {
    await runCommand('tar', ['-xf', archivePath, '-C', tempDir]);
    const entries = (await fsp.readdir(tempDir)).filter((entry) => entry !== '__MACOSX');
    const sourceRoot = entries.length === 1 && (await fsp.stat(path.join(tempDir, entries[0]))).isDirectory()
      ? path.join(tempDir, entries[0])
      : tempDir;

    await fsp.rm(targetDir, { recursive: true, force: true });
    await fsp.mkdir(targetDir, { recursive: true });

    for (const entry of await fsp.readdir(sourceRoot)) {
      await fsp.cp(path.join(sourceRoot, entry), path.join(targetDir, entry), { recursive: true });
    }
  } finally {
    await fsp.rm(tempDir, { recursive: true, force: true });
  }
}

async function ensureLlamaServerExecutable(dataRoot) {
  const llamaDir = path.join(dataRoot, 'llama');
  const executableName = llamaServerFilename();
  const target = path.join(llamaDir, executableName);
  if (!(await pathExists(target))) {
    const stack = [llamaDir];
    while (stack.length > 0) {
      const current = stack.pop();
      let entries = [];
      try {
        entries = await fsp.readdir(current, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        const entryPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(entryPath);
        } else if (entry.name === executableName) {
          await fsp.copyFile(entryPath, target);
          break;
        }
      }
    }
  }

  if (!(await pathExists(target))) {
    throw new Error('llama-server executable was not found after extraction.');
  }

  if (runtimePlatform().platformId !== 'windows') {
    await fsp.chmod(target, 0o755);
  }
}

async function installLlamaCpp(dataRoot, variant) {
  const info = await runtimeInfo(dataRoot);
  const supportedVariants = new Set(info.llamaInstallChoices.map((choice) => choice.id));
  if (!supportedVariants.has(variant)) {
    throw new Error(`Unsupported install choice: ${variant}`);
  }

  const release = await requestJson(LLAMA_RELEASE_API);
  const asset = selectLlamaAsset(release.assets || [], info.platform, info.arch, variant);
  const assetName = String(asset.name || '');
  const assetUrl = String(asset.browser_download_url || '');
  if (!assetName || !assetUrl) {
    throw new Error('Selected llama.cpp release asset is missing download metadata.');
  }

  const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'writingway-llama-download-'));
  try {
    const archivePath = path.join(tempDir, assetName);
    await downloadFile(assetUrl, archivePath, { 'User-Agent': 'Writingway/2.0' });
    await extractArchive(archivePath, path.join(dataRoot, 'llama'));
    await ensureLlamaServerExecutable(dataRoot);
  } finally {
    await fsp.rm(tempDir, { recursive: true, force: true });
  }

  return {
    ok: true,
    installed: true,
    assetName,
    platform: info.platform,
    arch: info.arch,
    variant,
    llamaServerPath: path.join('llama', llamaServerFilename()).replace(/\\/g, '/'),
    requiresRestart: true
  };
}

async function handleAppApi(request, response, appRoot, dataRoot, parsedUrl, integrations = {}) {
  if (request.method === 'GET' && parsedUrl.pathname === '/api/health') {
    jsonResponse(response, 200, { ok: true, service: 'writingway-desktop-server', timestamp: new Date().toISOString() });
    return true;
  }

  if (request.method === 'GET' && parsedUrl.pathname === '/api/runtime-info') {
    jsonResponse(response, 200, await runtimeInfo(dataRoot));
    return true;
  }

  if (request.method === 'GET' && parsedUrl.pathname === '/api/list-projects') {
    const projects = [];
    for (const file of await listProjectFiles(dataRoot)) {
      projects.push(await readProjectSummary(dataRoot, file));
    }
    jsonResponse(response, 200, { ok: true, projects, projectSaveLocation: await projectSaveRoot(dataRoot) });
    return true;
  }

  if (request.method === 'GET' && parsedUrl.pathname === '/api/get-project') {
    const projectId = String(parsedUrl.searchParams.get('projectId') || '').trim();
    const filename = String(parsedUrl.searchParams.get('filename') || '').trim();
    const file = await findProjectFile(dataRoot, projectId, filename);
    if (!file) {
      jsonResponse(response, 404, { ok: false, error: 'Project not found' });
      return true;
    }

    try {
      const project = JSON.parse(await fsp.readFile(file.filePath, 'utf8'));
      jsonResponse(response, 200, {
        ok: true,
        project,
        summary: await readProjectSummary(dataRoot, file),
        projectSaveLocation: await projectSaveRoot(dataRoot)
      });
    } catch (error) {
      jsonResponse(response, 500, { ok: false, error: error.message || 'Could not read project' });
    }
    return true;
  }

  if (request.method === 'POST' && parsedUrl.pathname === '/api/update-project-metadata') {
    try {
      const payload = await readJsonPayload(request);
      const projectId = String(payload.projectId || '').trim();
      const filename = String(payload.filename || '').trim();
      const file = await findProjectFile(dataRoot, projectId, filename);
      if (!file) {
        jsonResponse(response, 404, { ok: false, error: 'Project not found' });
        return true;
      }

      const snapshot = JSON.parse(await fsp.readFile(file.filePath, 'utf8'));
      if (!snapshot.project || typeof snapshot.project !== 'object') {
        throw new Error('Project snapshot is missing project metadata');
      }

      const metadata = normalizeProjectMetadata(payload.metadata || {});
      snapshot.project = {
        ...snapshot.project,
        ...metadata,
        modified: new Date().toISOString(),
        updatedAt: Date.now()
      };
      snapshot.filesystemSavedAt = new Date().toISOString();
      const saveVersion = Number(snapshot.filesystemSaveVersion || 1);
      snapshot.filesystemSaveVersion = Number.isFinite(saveVersion) ? Math.max(1, saveVersion) : 1;

      const projectsDir = await projectSaveRoot(dataRoot);
      const nextPath = path.join(projectsDir, projectFilename(snapshot.project));
      await writeJsonAtomic(nextPath, snapshot);
      if (nextPath !== file.filePath) {
        await fsp.rm(file.filePath, { force: true });
      }

      const nextFile = {
        filePath: nextPath,
        name: path.basename(nextPath),
        stats: await fsp.stat(nextPath)
      };
      jsonResponse(response, 200, {
        ok: true,
        project: snapshot,
        summary: await readProjectSummary(dataRoot, nextFile),
        projectSaveLocation: projectsDir
      });
    } catch (error) {
      jsonResponse(response, 500, { ok: false, error: error.message || 'Could not update project metadata' });
    }
    return true;
  }

  if (request.method === 'POST' && parsedUrl.pathname === '/api/create-project') {
    try {
      const payload = await readJsonPayload(request);
      const metadata = normalizeProjectMetadata(payload.metadata || {});
      const snapshot = createProjectSnapshot(metadata);
      const projectsDir = await projectSaveRoot(dataRoot);
      await fsp.mkdir(projectsDir, { recursive: true });
      const target = path.join(projectsDir, projectFilename(snapshot.project));
      await writeJsonAtomic(target, snapshot);

      const file = {
        filePath: target,
        name: path.basename(target),
        stats: await fsp.stat(target)
      };
      jsonResponse(response, 200, {
        ok: true,
        project: snapshot,
        summary: await readProjectSummary(dataRoot, file),
        projectSaveLocation: projectsDir
      });
    } catch (error) {
      jsonResponse(response, 500, { ok: false, error: error.message || 'Could not create project' });
    }
    return true;
  }

  if (request.method === 'POST' && parsedUrl.pathname === '/api/remove-project-from-library') {
    try {
      const payload = await readJsonPayload(request);
      const projectId = String(payload.projectId || '').trim();
      const filename = String(payload.filename || '').trim();
      const file = await findProjectFile(dataRoot, projectId, filename);
      if (!file) {
        jsonResponse(response, 404, { ok: false, error: 'Project not found' });
        return true;
      }

      const removedDir = path.join(await projectSaveRoot(dataRoot), '.removed-projects');
      await fsp.mkdir(removedDir, { recursive: true });
      const target = await uniqueFilePath(removedDir, file.name);
      await fsp.rename(file.filePath, target);
      jsonResponse(response, 200, {
        ok: true,
        removed: true,
        path: target
      });
    } catch (error) {
      jsonResponse(response, 500, { ok: false, error: error.message || 'Could not remove project from library' });
    }
    return true;
  }

  if (request.method === 'POST' && parsedUrl.pathname === '/api/reveal-project-file') {
    try {
      const payload = await readJsonPayload(request);
      const projectId = String(payload.projectId || '').trim();
      const filename = String(payload.filename || '').trim();
      const file = await findProjectFile(dataRoot, projectId, filename);
      if (!file) {
        jsonResponse(response, 404, { ok: false, error: 'Project not found' });
        return true;
      }

      if (typeof integrations.revealPath === 'function') {
        const result = await integrations.revealPath(file.filePath);
        if (result) throw new Error(result);
      } else if (typeof integrations.openPath === 'function') {
        const result = await integrations.openPath(path.dirname(file.filePath));
        if (result) throw new Error(result);
      } else {
        throw new Error('Open folder is not available in this environment.');
      }

      jsonResponse(response, 200, { ok: true, path: file.filePath });
    } catch (error) {
      jsonResponse(response, 500, { ok: false, error: error.message || 'Could not reveal project file' });
    }
    return true;
  }

  if (request.method === 'GET' && parsedUrl.pathname === '/api/list-backups') {
    const projectId = String(parsedUrl.searchParams.get('projectId') || '').trim();
    if (!projectId) {
      jsonResponse(response, 400, { ok: false, error: 'Missing projectId' });
      return true;
    }
    const backups = [];
    for (const file of await listBackupFiles(dataRoot, projectId)) {
      backups.push(await readBackupSummary(dataRoot, file));
    }
    jsonResponse(response, 200, { ok: true, backups, backupLocation: await backupRoot(dataRoot) });
    return true;
  }

  if (request.method === 'GET' && parsedUrl.pathname === '/api/list-all-backups') {
    const backups = [];
    for (const file of await listBackupFiles(dataRoot)) {
      backups.push(await readBackupSummary(dataRoot, file));
    }
    jsonResponse(response, 200, { ok: true, backups, backupLocation: await backupRoot(dataRoot) });
    return true;
  }

  if (request.method === 'GET' && parsedUrl.pathname === '/api/get-backup') {
    const projectId = String(parsedUrl.searchParams.get('projectId') || '').trim();
    const backupId = String(parsedUrl.searchParams.get('backupId') || '').trim();
    if (!projectId || !backupId) {
      jsonResponse(response, 400, { ok: false, error: 'Missing projectId or backupId' });
      return true;
    }
    if (path.basename(backupId) !== backupId) {
      jsonResponse(response, 400, { ok: false, error: 'Invalid backupId' });
      return true;
    }
    const file = await findBackupFile(dataRoot, projectId, backupId);
    if (!file) {
      jsonResponse(response, 404, { ok: false, error: 'Backup not found' });
      return true;
    }
    jsonResponse(response, 200, { ok: true, backup: JSON.parse(await fsp.readFile(file.filePath, 'utf8')) });
    return true;
  }

  if (request.method === 'POST' && parsedUrl.pathname === '/api/save-project') {
    try {
      const payload = await readJsonPayload(request);
      const project = payload && payload.project;
      if (!project || typeof project !== 'object') {
        jsonResponse(response, 400, { ok: false, error: 'Missing project payload' });
        return true;
      }
      const projectsDir = await projectSaveRoot(dataRoot);
      await fsp.mkdir(projectsDir, { recursive: true });
      const filename = projectFilename(project);
      const target = path.join(projectsDir, filename);
      const projectId = String(project.id);
      for (const entry of await fsp.readdir(projectsDir, { withFileTypes: true })) {
        const existingPath = path.join(projectsDir, entry.name);
        if (entry.isFile() && entry.name.endsWith(`--${projectId}.json`) && existingPath !== target) {
          await fsp.unlink(existingPath);
        }
      }
      payload.filesystemSavedAt = new Date().toISOString();
      payload.filesystemSaveVersion = 1;
      await writeJsonAtomic(target, payload);
      jsonResponse(response, 200, { ok: true, path: path.relative(projectsDir, target).replace(/\\/g, '/'), filename, projectSaveLocation: projectsDir });
    } catch (error) {
      jsonResponse(response, 500, { ok: false, error: error.message });
    }
    return true;
  }

  if (request.method === 'POST' && parsedUrl.pathname === '/api/create-backup') {
    try {
      const payload = await readJsonPayload(request);
      const project = payload && payload.project;
      if (!project || typeof project !== 'object') {
        jsonResponse(response, 400, { ok: false, error: 'Missing project payload' });
        return true;
      }
      const projectId = String(project.id || '').trim();
      if (!projectId) {
        throw new Error('Project id is required');
      }
      const requestOptions = payload.backupRequest || {};
      const reason = requestOptions.reason || 'manual';
      const note = requestOptions.note || '';
      const retention = requestOptions.retention || { mode: 'count', count: 100 };
      const hash = snapshotHash(payload);
      const existing = await listBackupFiles(dataRoot, projectId);
      const latest = existing[0] ? await readBackupSummary(dataRoot, existing[0]) : null;
      if (reason === 'auto' && latest && latest.hash === hash) {
        jsonResponse(response, 200, {
          ok: true,
          skipped: true,
          backupCount: existing.length,
          backupLocation: await backupRoot(dataRoot),
          timestamp: new Date().toISOString()
        });
        return true;
      }
      const dir = await backupDir(dataRoot, projectId);
      const baseFilename = backupFilename(project, payload.exportedAt);
      const filename = `${baseFilename.slice(0, -5)}--${sanitizeFilename(reason)}.json`;
      const target = path.join(dir, filename);
      const stats = snapshotStats(payload);
      payload.localBackupSavedAt = new Date().toISOString();
      payload.localBackupVersion = 1;
      payload.backupMeta = {
        reason,
        note,
        hash,
        createdAt: payload.localBackupSavedAt,
        ...stats
      };
      await writeJsonAtomic(target, payload);
      await pruneBackups(dataRoot, projectId, retention);
      const backupCount = (await listBackupFiles(dataRoot, projectId)).length;
      jsonResponse(response, 200, {
        ok: true,
        backupId: filename,
        path: path.relative(await backupRoot(dataRoot), target).replace(/\\/g, '/'),
        timestamp: payload.localBackupSavedAt,
        backupCount,
        backupLocation: await backupRoot(dataRoot)
      });
    } catch (error) {
      jsonResponse(response, 500, { ok: false, error: error.message });
    }
    return true;
  }

  if (request.method === 'POST' && parsedUrl.pathname === '/api/install-llama') {
    try {
      const payload = await readJsonPayload(request);
      const variant = String((payload && payload.variant) || 'cpu').trim().toLowerCase();
      jsonResponse(response, 200, await installLlamaCpp(dataRoot, variant));
    } catch (error) {
      jsonResponse(response, 500, { ok: false, error: error.message });
    }
    return true;
  }

  if (request.method === 'POST' && parsedUrl.pathname === '/api/shutdown') {
    jsonResponse(response, 200, {
      ok: true,
      message: 'Writingway is shutting down. Restart the launcher to enable local AI.'
    });
    return true;
  }

  if (request.method === 'GET' && parsedUrl.pathname === '/api/backup-location') {
    jsonResponse(response, 200, { ok: true, path: await backupRoot(dataRoot) });
    return true;
  }

  if (request.method === 'POST' && parsedUrl.pathname === '/api/backup-location') {
    try {
      const payload = await readJsonPayload(request);
      const settings = await readSettings(dataRoot);
      const nextPath = String(payload.path || '').trim();
      settings.backupLocation = nextPath ? path.resolve(nextPath) : '';
      await writeSettings(dataRoot, settings);
      await fsp.mkdir(await backupRoot(dataRoot), { recursive: true });
      jsonResponse(response, 200, { ok: true, path: await backupRoot(dataRoot) });
    } catch (error) {
      jsonResponse(response, 500, { ok: false, error: error.message });
    }
    return true;
  }

  if (request.method === 'POST' && parsedUrl.pathname === '/api/cleanup-backups') {
    try {
      const payload = await readJsonPayload(request);
      const scope = payload.scope === 'all' ? 'all' : 'project';
      const projectId = scope === 'all' ? '' : String(payload.projectId || '').trim();
      if (scope === 'project' && !projectId) throw new Error('Missing projectId');
      const files = await listBackupFiles(dataRoot, projectId);
      for (const file of files) {
        await fsp.rm(file.filePath, { force: true });
      }
      jsonResponse(response, 200, { ok: true, deleted: files.length, backupCount: 0 });
    } catch (error) {
      jsonResponse(response, 500, { ok: false, error: error.message });
    }
    return true;
  }

  if (request.method === 'POST' && parsedUrl.pathname === '/api/delete-backup') {
    try {
      const payload = await readJsonPayload(request);
      const projectId = String(payload.projectId || '').trim();
      const backupId = String(payload.backupId || '').trim();
      if (!projectId || !backupId) throw new Error('Missing projectId or backupId');
      if (path.basename(backupId) !== backupId) throw new Error('Invalid backupId');
      const target = await findBackupFile(dataRoot, projectId, backupId);
      if (target) await fsp.rm(target.filePath, { force: true });
      jsonResponse(response, 200, { ok: true, backupCount: (await listBackupFiles(dataRoot, projectId)).length });
    } catch (error) {
      jsonResponse(response, 500, { ok: false, error: error.message });
    }
    return true;
  }

  if (request.method === 'POST' && parsedUrl.pathname === '/api/update-backup') {
    try {
      const payload = await readJsonPayload(request);
      const projectId = String(payload.projectId || '').trim();
      const backupId = String(payload.backupId || '').trim();
      if (!projectId || !backupId) throw new Error('Missing projectId or backupId');
      if (path.basename(backupId) !== backupId) throw new Error('Invalid backupId');
      const target = await findBackupFile(dataRoot, projectId, backupId);
      if (!target) throw new Error('Backup not found');
      const backup = JSON.parse(await fsp.readFile(target.filePath, 'utf8'));
      backup.backupMeta = { ...(backup.backupMeta || {}) };
      if (Object.prototype.hasOwnProperty.call(payload, 'pinned')) {
        backup.backupMeta.pinned = !!payload.pinned;
      }
      if (Object.prototype.hasOwnProperty.call(payload, 'note')) {
        backup.backupMeta.note = String(payload.note || '');
      }
      await writeJsonAtomic(target.filePath, backup);
      jsonResponse(response, 200, {
        ok: true,
        backup: await readBackupSummary(dataRoot, {
          root: target.root,
          filePath: target.filePath,
          name: path.basename(target.filePath),
          stats: await fsp.stat(target.filePath)
        })
      });
    } catch (error) {
      jsonResponse(response, 500, { ok: false, error: error.message });
    }
    return true;
  }

  if (request.method === 'GET' && parsedUrl.pathname === '/api/project-save-location') {
    jsonResponse(response, 200, { ok: true, path: await projectSaveRoot(dataRoot) });
    return true;
  }

  if (request.method === 'POST' && parsedUrl.pathname === '/api/project-save-location') {
    try {
      const payload = await readJsonPayload(request);
      const settings = await readSettings(dataRoot);
      const nextPath = String(payload.path || '').trim();
      settings.projectSaveLocation = nextPath ? path.resolve(nextPath) : '';
      settings.backupLocation = '';
      await writeSettings(dataRoot, settings);
      await fsp.mkdir(await projectSaveRoot(dataRoot), { recursive: true });
      await fsp.mkdir(await backupRoot(dataRoot), { recursive: true });
      jsonResponse(response, 200, { ok: true, path: await projectSaveRoot(dataRoot) });
    } catch (error) {
      jsonResponse(response, 500, { ok: false, error: error.message });
    }
    return true;
  }

  return false;
}

async function serveStatic(request, response, appRoot, parsedUrl) {
  const decodedPath = decodeURIComponent(parsedUrl.pathname);
  const relativePath = decodedPath === '/' ? 'desktop.html' : decodedPath.replace(/^\/+/, '');
  const filePath = path.resolve(appRoot, relativePath);
  if (filePath !== appRoot && !filePath.startsWith(`${appRoot}${path.sep}`)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const stats = await fsp.stat(filePath);
    const finalPath = stats.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    const body = await fsp.readFile(finalPath);
    response.writeHead(200, {
      'Content-Type': MIME_TYPES[path.extname(finalPath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-store'
    });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end('Not found');
  }
}

function runGit(rootDir, args) {
  return runCommand('git', args, { cwd: rootDir, timeout: 10000 })
    .then(({ stdout }) => stdout.trim())
    .catch(() => '');
}

async function getLocalVersion(rootDir) {
  const [commit, commitDate, branch, upstream, status] = await Promise.all([
    runGit(rootDir, ['rev-parse', 'HEAD']),
    runGit(rootDir, ['show', '-s', '--format=%cI', 'HEAD']),
    runGit(rootDir, ['rev-parse', '--abbrev-ref', 'HEAD']),
    runGit(rootDir, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']),
    runGit(rootDir, ['status', '--porcelain'])
  ]);
  return {
    commit: commit || null,
    commitDate: commitDate || null,
    branch: branch || null,
    upstream: upstream || null,
    dirty: Boolean(status)
  };
}

async function getUpdateDownloadUrl() {
  const releasesUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;
  try {
    const data = await requestJson(releasesUrl);
    const zipAsset = (data.assets || []).find((asset) => String(asset.name || '').endsWith('.zip'));
    if (zipAsset && zipAsset.browser_download_url) {
      return { url: zipAsset.browser_download_url, source: 'release' };
    }
    if (data.zipball_url) {
      return { url: data.zipball_url, source: 'release' };
    }
  } catch {
    // Fall through to branch archive when no release exists or GitHub is unreachable.
  }
  return {
    url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/refs/heads/${BRANCH}.zip`,
    source: 'archive'
  };
}

async function downloadUpdate(rootDir) {
  const updateDir = path.join(rootDir, '.update');
  const latestZip = path.join(updateDir, 'latest.zip');
  const readyJson = path.join(updateDir, 'ready.json');
  await fsp.mkdir(updateDir, { recursive: true });
  const { url, source } = await getUpdateDownloadUrl();
  const downloaded = await downloadFile(url, latestZip, { 'User-Agent': 'Writingway2-Updater/1.0' });
  const stats = await fsp.stat(latestZip);
  if (stats.size < 1000) {
    throw new Error('Download failed: File too small or empty');
  }
  await writeJsonAtomic(readyJson, {
    downloaded_at: String(stats.mtimeMs),
    source,
    url,
    size: downloaded
  });
  return 'Downloaded. Restart to apply.';
}

async function clearUpdate(rootDir) {
  const updateDir = path.join(rootDir, '.update');
  await fsp.rm(path.join(updateDir, 'ready.json'), { force: true });
  await fsp.rm(path.join(updateDir, 'latest.zip'), { force: true });
  await fsp.rm(path.join(updateDir, 'extract'), { recursive: true, force: true });
}

async function handleUpdaterApi(request, response, appRoot, dataRoot, parsedUrl) {
  if (request.method === 'OPTIONS') {
    response.writeHead(200, corsHeaders());
    response.end();
    return;
  }

  if (request.method === 'GET' && parsedUrl.pathname === '/version') {
    jsonResponse(response, 200, await getLocalVersion(appRoot), true);
    return;
  }
  if (request.method === 'GET' && parsedUrl.pathname === '/health') {
    jsonResponse(response, 200, { ok: true, service: 'writingway-desktop-updater' }, true);
    return;
  }
  if (request.method === 'GET' && parsedUrl.pathname === '/update/status') {
    const ready = await pathExists(path.join(dataRoot, '.update', 'ready.json'))
      && await pathExists(path.join(dataRoot, '.update', 'latest.zip'));
    jsonResponse(response, 200, { ready }, true);
    return;
  }
  if (request.method === 'POST' && parsedUrl.pathname === '/update/download') {
    try {
      jsonResponse(response, 200, { ok: true, message: await downloadUpdate(dataRoot) }, true);
    } catch (error) {
      jsonResponse(response, 500, { ok: false, error: error.message }, true);
    }
    return;
  }
  if (request.method === 'POST' && parsedUrl.pathname === '/update/clear') {
    try {
      await clearUpdate(dataRoot);
      jsonResponse(response, 200, { ok: true, message: 'Update files cleared' }, true);
    } catch (error) {
      jsonResponse(response, 500, { ok: false, error: error.message }, true);
    }
    return;
  }

  jsonResponse(response, 404, { error: 'Not found' }, true);
}

function createServer(port, requestHandler) {
  const server = http.createServer((request, response) => {
    const parsedUrl = new URL(request.url, `http://${HOST}:${port}`);
    requestHandler(request, response, parsedUrl).catch((error) => {
      console.error(error);
      if (!response.headersSent) {
        jsonResponse(response, 500, { ok: false, error: error.message });
      } else {
        response.end();
      }
    });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, HOST, () => {
      server.off('error', reject);
      resolve(server);
    });
  });
}

async function startDesktopServers({ appRoot, dataRoot, chooseBackupFolder, chooseProjectSaveFolder, openPath, revealPath }) {
  await fsp.mkdir(await projectSaveRoot(dataRoot), { recursive: true });
  await fsp.mkdir(await backupRoot(dataRoot), { recursive: true });
  await fsp.mkdir(path.join(dataRoot, 'project-backups'), { recursive: true });

  const appServer = await createServer(APP_PORT, async (request, response, parsedUrl) => {
    if (request.method === 'POST' && parsedUrl.pathname === '/api/choose-backup-folder') {
      try {
        if (typeof chooseBackupFolder !== 'function') throw new Error('Folder picker is not available in this environment.');
        const payload = await readJsonPayload(request).catch(() => ({}));
        const selected = await chooseBackupFolder(payload.currentPath || await backupRoot(dataRoot));
        if (!selected) {
          jsonResponse(response, 200, { ok: true, canceled: true });
          return;
        }
        const settings = await readSettings(dataRoot);
        settings.backupLocation = path.resolve(selected);
        await writeSettings(dataRoot, settings);
        await fsp.mkdir(await backupRoot(dataRoot), { recursive: true });
        jsonResponse(response, 200, { ok: true, path: await backupRoot(dataRoot) });
      } catch (error) {
        jsonResponse(response, 500, { ok: false, error: error.message });
      }
      return;
    }

    if (request.method === 'POST' && parsedUrl.pathname === '/api/open-backup-folder') {
      try {
        const target = await backupRoot(dataRoot);
        await fsp.mkdir(target, { recursive: true });
        if (typeof openPath !== 'function') throw new Error('Open folder is not available in this environment.');
        const result = await openPath(target);
        if (result) throw new Error(result);
        jsonResponse(response, 200, { ok: true });
      } catch (error) {
        jsonResponse(response, 500, { ok: false, error: error.message });
      }
      return;
    }

    if (request.method === 'POST' && parsedUrl.pathname === '/api/choose-project-save-folder') {
      try {
        if (typeof chooseProjectSaveFolder !== 'function') throw new Error('Folder picker is not available in this environment.');
        const payload = await readJsonPayload(request).catch(() => ({}));
        const selected = await chooseProjectSaveFolder(payload.currentPath || await projectSaveRoot(dataRoot));
        if (!selected) {
          jsonResponse(response, 200, { ok: true, canceled: true });
          return;
        }
        const settings = await readSettings(dataRoot);
        settings.projectSaveLocation = path.resolve(selected);
        settings.backupLocation = '';
        await writeSettings(dataRoot, settings);
        await fsp.mkdir(await projectSaveRoot(dataRoot), { recursive: true });
        await fsp.mkdir(await backupRoot(dataRoot), { recursive: true });
        jsonResponse(response, 200, { ok: true, path: await projectSaveRoot(dataRoot) });
      } catch (error) {
        jsonResponse(response, 500, { ok: false, error: error.message });
      }
      return;
    }

    if (request.method === 'POST' && parsedUrl.pathname === '/api/open-project-save-folder') {
      try {
        const target = await projectSaveRoot(dataRoot);
        await fsp.mkdir(target, { recursive: true });
        if (typeof openPath !== 'function') throw new Error('Open folder is not available in this environment.');
        const result = await openPath(target);
        if (result) throw new Error(result);
        jsonResponse(response, 200, { ok: true });
      } catch (error) {
        jsonResponse(response, 500, { ok: false, error: error.message });
      }
      return;
    }

    if (await handleAppApi(request, response, appRoot, dataRoot, parsedUrl, { openPath, revealPath })) {
      return;
    }
    await serveStatic(request, response, appRoot, parsedUrl);
  });

  const updaterServer = await createServer(UPDATER_PORT, async (request, response, parsedUrl) => {
    await handleUpdaterApi(request, response, appRoot, dataRoot, parsedUrl);
  });

  return {
    appServer,
    updaterServer,
    close() {
      appServer.close();
      updaterServer.close();
    }
  };
}

module.exports = {
  startDesktopServers
};
