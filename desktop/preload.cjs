const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('buppoDesktopUpdater', {
  onStatus(callback) {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('buppo-update-status', listener);
    return () => ipcRenderer.removeListener('buppo-update-status', listener);
  }
});

contextBridge.exposeInMainWorld('buppoDesktop', {
  quit() {
    ipcRenderer.send('buppo-quit-app');
  }
});
