const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const appUrl = 'http://127.0.0.1:8000/main.html';

const services = [
  {
    name: 'Writingway app server',
    url: 'http://127.0.0.1:8000/main.html',
    script: path.join(rootDir, 'tools', 'writingway-server.py')
  },
  {
    name: 'Writingway updater server',
    url: 'http://127.0.0.1:8001/version',
    script: path.join(rootDir, 'tools', 'updater-server.py')
  }
];

const managedProcesses = [];

function isReachable(url, timeoutMs = 900) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 500);
    });

    request.on('error', () => resolve(false));
    request.setTimeout(timeoutMs, () => {
      request.destroy();
      resolve(false);
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startPythonScript(service) {
  const child = spawn('python', [service.script], {
    cwd: rootDir,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', (data) => {
    console.log(`[${service.name}] ${data.toString().trim()}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`[${service.name}] ${data.toString().trim()}`);
  });

  child.on('error', (error) => {
    console.error(`[${service.name}] failed to start: ${error.message}`);
  });

  child.on('exit', (code, signal) => {
    console.log(`[${service.name}] exited with code ${code} signal ${signal}`);
  });

  managedProcesses.push(child);
  return child;
}

async function ensureService(service) {
  if (await isReachable(service.url)) {
    console.log(`${service.name} is already running.`);
    return;
  }

  console.log(`Starting ${service.name}...`);
  startPythonScript(service);

  for (let attempt = 0; attempt < 30; attempt += 1) {
    await delay(500);
    if (await isReachable(service.url)) {
      console.log(`${service.name} is ready.`);
      return;
    }
  }

  throw new Error(`${service.name} did not become ready in time.`);
}

async function startServices() {
  for (const service of services) {
    await ensureService(service);
  }
}

function createWindow() {
  const window = new BrowserWindow({
    title: 'Writingway',
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 680,
    backgroundColor: '#14161b',
    icon: path.join(rootDir, 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.loadURL(appUrl);

  if (!app.isPackaged) {
    window.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12') {
        window.webContents.toggleDevTools();
        event.preventDefault();
      }
    });
  }
}

function stopManagedProcesses() {
  for (const child of managedProcesses) {
    if (!child.killed) {
      child.kill();
    }
  }
}

app.whenReady().then(async () => {
  try {
    await startServices();
    createWindow();
  } catch (error) {
    console.error(error);
    dialog.showErrorBox('Writingway failed to start', error.message);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', stopManagedProcesses);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
