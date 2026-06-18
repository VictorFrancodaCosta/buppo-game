const { app, BrowserWindow, shell } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const isDev = !app.isPackaged;
let localServer = null;
let appOrigin = '';
const authHosts = new Set([
  'accounts.google.com',
  'apis.google.com',
  'buppo-game.firebaseapp.com',
  'www.googleapis.com'
]);

function isAuthUrl(url) {
  try {
    const parsed = new URL(url);
    return authHosts.has(parsed.hostname) || parsed.hostname.endsWith('.google.com');
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

      if (!requestedPath.startsWith(rootDir)) {
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
          'Cache-Control': 'no-store'
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
    fullscreenable: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      nativeWindowOpen: true,
      partition: 'persist:buppo'
    }
  });

  win.loadURL(`${origin}/index.html`);

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
            sandbox: false,
            partition: 'persist:buppo'
          }
        }
      };
    }
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith(origin)) return;
    if (isAuthUrl(url)) return;
    if (/^https?:\/\//i.test(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  if (isDev && process.env.BUPPO_DEVTOOLS === '1') {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(async () => {
  app.setAppUserModelId('com.buppo.game');
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
