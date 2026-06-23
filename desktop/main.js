const { app, BrowserWindow, dialog, shell } = require('electron');
const http = require('http');
const path = require('path');
const { startDesktopServers } = require('./local-server');

const rootDir = path.resolve(__dirname, '..');
const appUrl = 'http://127.0.0.1:8000/main.html';

let managedServers = null;

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

async function startServices() {
  const appServerReady = await isReachable('http://127.0.0.1:8000/main.html');
  const updaterServerReady = await isReachable('http://127.0.0.1:8001/version');

  if (appServerReady && updaterServerReady) {
    console.log('Writingway local services are already running.');
    return;
  }

  if (appServerReady || updaterServerReady) {
    throw new Error('Port 8000 or 8001 is already in use. Close the other Writingway launcher and try again.');
  }

  managedServers = await startDesktopServers({
    appRoot: rootDir,
    dataRoot: app.isPackaged ? app.getPath('userData') : rootDir,
    chooseBackupFolder: async (currentPath) => {
      const result = await dialog.showOpenDialog({
        title: 'Choose backup folder',
        defaultPath: currentPath || app.getPath('documents'),
        properties: ['openDirectory', 'createDirectory']
      });
      return result.canceled ? null : result.filePaths[0];
    },
    openPath: async (targetPath) => shell.openPath(targetPath)
  });
  console.log('Writingway desktop services are ready.');
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

function stopManagedServers() {
  if (managedServers) {
    managedServers.close();
    managedServers = null;
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

app.on('before-quit', stopManagedServers);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
