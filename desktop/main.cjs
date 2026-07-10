const { app, BrowserWindow, ipcMain, shell } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');
let autoUpdater = null;
try {
  ({ autoUpdater } = require('electron-updater'));
} catch (e) {
  autoUpdater = null;
}

const isDev = !app.isPackaged;
let localServer = null;
let appOrigin = '';
let mainWindow = null;
let updaterStarted = false;
const authHosts = new Set([
  'accounts.google.com',
  'apis.google.com',
  'buppo-game.firebaseapp.com',
  'www.googleapis.com',
  'oauth2.googleapis.com'
]);

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com",
  "media-src 'self' blob:",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.gstatic.com",
  "frame-src https://accounts.google.com https://buppo-game.firebaseapp.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
  "frame-ancestors 'self'"
].join('; ');

function isAuthUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && authHosts.has(parsed.hostname);
  } catch (e) {
    return false;
  }
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ico': 'image/x-icon'
};

function startLocalServer() {
  const rootDir = path.join(__dirname, '..');

  return new Promise((resolve, reject) => {
    localServer = http.createServer((req, res) => {
      const requestUrl = new URL(req.url, 'http://localhost');
      const decodedPath = decodeURIComponent(requestUrl.pathname);
      const relativePath = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^\/+/, '');
      const requestedPath = path.normalize(path.join(rootDir, relativePath));
      const pathInsideRoot = path.relative(rootDir, requestedPath);

      if (pathInsideRoot.startsWith('..') || path.isAbsolute(pathInsideRoot)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      fs.readFile(requestedPath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        const ext = path.extname(requestedPath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': mimeTypes[ext] || 'application/octet-stream',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'no-referrer',
          'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
          'Content-Security-Policy': contentSecurityPolicy
        });
        res.end(data);
      });
    });

    localServer.on('error', reject);
    localServer.listen(0, 'localhost', () => {
      const address = localServer.address();
      appOrigin = `http://localhost:${address.port}`;
      resolve(appOrigin);
    });
  });
}

function sendUpdateStatus(payload) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send('buppo-update-status', payload);
}

function setupAutoUpdater(win) {
  if (updaterStarted) return;
  updaterStarted = true;

  if (isDev || !autoUpdater) {
    sendUpdateStatus({ state: 'disabled' });
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    sendUpdateStatus({ state: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    sendUpdateStatus({ state: 'available', version: info && info.version });
  });

  autoUpdater.on('download-progress', (progress) => {
    sendUpdateStatus({
      state: 'progress',
      percent: progress && Number.isFinite(progress.percent) ? progress.percent : 0
    });
  });

  autoUpdater.on('update-not-available', () => {
    sendUpdateStatus({ state: 'not-available' });
  });

  autoUpdater.on('update-downloaded', () => {
    sendUpdateStatus({ state: 'downloaded' });
  });

  autoUpdater.on('error', (error) => {
    sendUpdateStatus({ state: 'error', message: error && error.message });
  });

  win.webContents.once('did-finish-load', () => {
    setTimeout(() => {
      sendUpdateStatus({ state: 'checking' });
      autoUpdater.checkForUpdates().catch((error) => {
        sendUpdateStatus({ state: 'error', message: error && error.message });
      });
    }, 450);
  });
}

async function createWindow() {
  const origin = appOrigin || await startLocalServer();
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540,
    backgroundColor: '#120806',
    title: 'BUPPO',
    autoHideMenuBar: true,
    fullscreen: true,
    fullscreenable: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      nativeWindowOpen: true,
      preload: path.join(__dirname, 'preload.cjs'),
      partition: 'persist:buppo'
    }
  });
  mainWindow = win;

  win.loadURL(`${origin}/index.html`);
  setupAutoUpdater(win);

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAuthUrl(url)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 520,
          height: 720,
          autoHideMenuBar: true,
          backgroundColor: '#120806',
          title: 'Login BUPPO',
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            preload: path.join(__dirname, 'preload.cjs'),
            partition: 'persist:buppo'
          }
        }
      };
    }
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'deny' };
  });

  win.webContents.on('did-create-window', (childWindow) => {
    childWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
      return { action: 'deny' };
    });
    childWindow.webContents.on('will-navigate', (event, url) => {
      if (isAuthUrl(url)) return;
      event.preventDefault();
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    });
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith(origin)) return;
    if (isAuthUrl(url)) return;
    event.preventDefault();
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
    }
  });

  if (isDev && process.env.BUPPO_DEVTOOLS === '1') {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(async () => {
  app.setAppUserModelId('com.buppo.game');
  ipcMain.on('buppo-quit-app', () => {
    app.quit();
  });
  await startLocalServer();
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (localServer) {
    localServer.close();
    localServer = null;
  }
  if (process.platform !== 'darwin') app.quit();
});
