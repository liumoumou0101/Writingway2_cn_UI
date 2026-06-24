const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('writingwayDesktop', {
  toggleFullscreen: () => ipcRenderer.invoke('writingway:toggle-fullscreen')
});
