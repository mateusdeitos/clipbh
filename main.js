import { app, BrowserWindow, clipboard, ipcMain, nativeImage, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import initSqlJs from 'sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;

const dbPath = path.join(app.getPath('userData'), 'clipboard_history.wasm.db');
let db;
let SQL;

// Inicialização da Base de Dados WASM
async function initDatabase() {
  SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      content TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      tags TEXT DEFAULT '[]'
    )
  `);
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_history_type_content ON history (type, content)`);
  saveDatabaseToDisk();
}

// Grava o estado da memória para o ficheiro físico
function saveDatabaseToDisk() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

let isWatching = true;
let mainWindow;

// Snooze timers: id → { handle, expiresAt, preview }
const activeSnoozes = new Map();

// Active floating notification windows: id → BrowserWindow
const notificationWindows = new Map();

const NOTIF_WIDTH = 360;
const NOTIF_HEIGHT = 150;
const NOTIF_MARGIN = 16;
const NOTIF_GAP = 10;

function createNotificationWindow(id, _preview) {
  // Close any existing notification for this id
  if (notificationWindows.has(id)) {
    notificationWindows.get(id).destroy();
    notificationWindows.delete(id);
  }

  const { workArea } = screen.getPrimaryDisplay();
  const stackOffset = notificationWindows.size * (NOTIF_HEIGHT + NOTIF_GAP);

  const win = new BrowserWindow({
    width: NOTIF_WIDTH,
    height: NOTIF_HEIGHT,
    x: workArea.x + workArea.width - NOTIF_WIDTH - NOTIF_MARGIN,
    y: workArea.y + workArea.height - NOTIF_HEIGHT - NOTIF_MARGIN - stackOffset,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    hasShadow: false,
    focusable: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'notification-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true, 'floating');

  if (isDev) {
    win.loadURL(`http://localhost:5173/notification.html?id=${id}`);
  } else {
    win.loadFile(path.join(__dirname, 'dist/notification.html'), {
      query: { id: String(id) },
    });
  }

  notificationWindows.set(id, win);
  win.on('closed', () => notificationWindows.delete(id));
}

ipcMain.on('notification-resize', (event, height) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  win.setSize(NOTIF_WIDTH, Math.max(80, Math.min(400, Math.round(height))));
  if (!win.isVisible()) win.show();
});

ipcMain.on('notification-dismiss', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.destroy();
});

ipcMain.on('notification-focus-item', (event) => {
  // Identify which entry this notification belongs to
  const notifWin = BrowserWindow.fromWebContents(event.sender);
  let entryId = null;
  for (const [id, w] of notificationWindows) {
    if (w === notifWin) { entryId = id; break; }
  }

  if (notifWin) notifWin.destroy();

  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    if (entryId !== null) mainWindow.webContents.send('snooze-focus', { id: entryId });
  }
});

function createWindow() {
  if (app.dock) {
    const iconPath = isDev
      ? path.join(__dirname, 'assets/icon.png')
      : path.join(process.resourcesPath, 'assets/icon.png');
    app.dock.setIcon(iconPath);
  }

  mainWindow = new BrowserWindow({
    width: 450,
    height: 800,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

// Monitorização do Clipboard
let lastText = clipboard.readText();
let lastImageDataUrl = clipboard.readImage().toDataURL();
let lastFileUrl = '';
let imageSaveTimer = null;

function pollClipboard(onChange) {
  const formats = clipboard.availableFormats();

  const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff', '.tif']);

  // File copied from filesystem — NSFilenamesPboardType gives the real absolute
  // path directly, avoiding the /.file/id= reference URL problem entirely.
  if (formats.includes('text/uri-list')) {
    const xml = clipboard.readBuffer('NSFilenamesPboardType').toString();
    const match = xml.match(/<string>(.*?)<\/string>/);
    const filePath = match?.[1] ?? null;

    if (filePath && filePath !== lastFileUrl) {
      lastFileUrl = filePath;
      lastText = clipboard.readText(); // prevent filename from also saving as text
      const ext = path.extname(filePath).toLowerCase();

      if (IMAGE_EXTS.has(ext)) {
        // Read the actual image file — clipboard.readImage() only has the Finder icon
        const img = nativeImage.createFromPath(filePath);
        if (!img.isEmpty()) {
          const dataUrl = img.toDataURL();
          lastImageDataUrl = dataUrl; // prevent re-capture via the image branch
          onChange('image', dataUrl);
          return;
        }
      }

      onChange('file', filePath);
    }
    return;
  }

  // Image copied (e.g. from browser or design tool)
  // Debounced: macOS sometimes updates the clipboard image twice in quick
  // succession (e.g. actual content → file icon), so we wait 800ms for it
  // to settle before committing.
  const currentImage = clipboard.readImage();
  if (!currentImage.isEmpty()) {
    const dataUrl = currentImage.toDataURL();
    if (dataUrl !== lastImageDataUrl) {
      lastImageDataUrl = dataUrl;
      lastText = clipboard.readText(); // prevent concurrent text from also saving
      onChange('image', dataUrl);
    }
    return;
  }

  // Plain text (skip if clipboard also has an image)
  const currentText = clipboard.readText();
  if (currentText && currentText !== lastText && clipboard.readImage().isEmpty()) {
    lastText = currentText;
    onChange('text', currentText);
  }
}

setInterval(() => pollClipboard(saveEntry), 1000);

let sendDebounceTimer = null;
function sendClipboardUpdate(payload) {
  clearTimeout(sendDebounceTimer);
  sendDebounceTimer = setTimeout(() => {
    if (mainWindow) mainWindow.webContents.send('clipboard-update', payload);
  }, 200);
}

function saveEntry(type, content) {
  if (!db || !isWatching) return;

  db.run(
    `INSERT INTO history (type, content, tags) VALUES (?, ?, '[]')
     ON CONFLICT (type, content) DO UPDATE SET timestamp = CURRENT_TIMESTAMP`,
    [type, content]
  );
  saveDatabaseToDisk();

  const res = db.exec('SELECT id, timestamp FROM history WHERE type = ? AND content = ?', [type, content]);
  const [id, timestamp] = res[0].values[0];

  sendClipboardUpdate({ id, type, content, tags: [], timestamp: new Date(timestamp.replace(' ', 'T') + 'Z') });
}

// Handlers IPC
ipcMain.handle('get-watch-status', () => isWatching);

ipcMain.handle('toggle-clipboard-watch', () => {
  isWatching = !isWatching;
  if (isWatching) {
    lastText = '';
    lastImageDataUrl = '';
    lastFileUrl = '';
    clipboard.clear("clipboard");
  }
  return isWatching;
});

ipcMain.handle('get-history', (event, searchQuery) => {
  if (!db) return [];

  let stmt;
  if (searchQuery) {
    stmt = db.prepare('SELECT * FROM history WHERE content LIKE $search OR tags LIKE $search ORDER BY timestamp DESC');
    stmt.bind({ $search: `%${searchQuery}%` });
  } else {
    stmt = db.prepare('SELECT * FROM history ORDER BY timestamp DESC');
  }

  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    row.tags = JSON.parse(row.tags);
    row.timestamp = new Date(row.timestamp.replace(' ', 'T') + 'Z');
    results.push(row);
  }
  stmt.free();
  return results;
});

ipcMain.handle('delete-entry', (_event, id) => {
  if (activeSnoozes.has(id)) {
    clearTimeout(activeSnoozes.get(id).handle);
    activeSnoozes.delete(id);
  }
  if (notificationWindows.has(id)) {
    notificationWindows.get(id).destroy();
  }
  db.run('DELETE FROM history WHERE id = ?', [id]);
  saveDatabaseToDisk();
});

ipcMain.handle('update-tags', (_event, id, tags) => {
  db.run('UPDATE history SET tags = ? WHERE id = ?', [JSON.stringify(tags), id]);
  saveDatabaseToDisk();
});

ipcMain.handle('clear-history', () => {
  for (const { handle } of activeSnoozes.values()) clearTimeout(handle);
  activeSnoozes.clear();
  db.run('DELETE FROM history');
  saveDatabaseToDisk();
});

ipcMain.on('copy-to-os', (_event, type, content) => {
  if (type === 'image') {
    lastImageDataUrl = content;
    clipboard.writeImage(nativeImage.createFromDataURL(content));
  } else {
    lastText = content;
    clipboard.writeText(content);
  }
});

ipcMain.handle('set-snooze', (_event, id, durationMs) => {
  if (activeSnoozes.has(id)) {
    clearTimeout(activeSnoozes.get(id).handle);
  }

  const res = db.exec('SELECT content, type FROM history WHERE id = ?', [id]);
  if (!res.length) return;
  const [content, type] = res[0].values[0];
  const preview = type === 'text' || type === 'file'
    ? String(content).substring(0, 80)
    : 'Image';

  const expiresAt = Date.now() + durationMs;

  const handle = setTimeout(() => {
    activeSnoozes.delete(id);

    if (mainWindow) mainWindow.webContents.send('snooze-expired', { id });

    createNotificationWindow(id, preview);
  }, durationMs);

  activeSnoozes.set(id, { handle, expiresAt, preview });
});

ipcMain.handle('cancel-snooze', (_event, id) => {
  if (activeSnoozes.has(id)) {
    clearTimeout(activeSnoozes.get(id).handle);
    activeSnoozes.delete(id);
  }
});

ipcMain.handle('get-notification-data', (_event, id) => {
  const res = db.exec('SELECT type, content FROM history WHERE id = ?', [id]);
  if (!res.length) return null;
  const [type, content] = res[0].values[0];
  return { type, content };
});

ipcMain.handle('get-active-snoozes', () => {
  const result = {};
  for (const [id, { expiresAt }] of activeSnoozes) {
    result[id] = expiresAt;
  }
  return result;
});

app.whenReady().then(async () => {
  try {
    await initDatabase();
  } catch (err) {
    console.error('Database init failed, resetting DB:', err);
    try { fs.unlinkSync(dbPath); } catch (_) {}
    await initDatabase();
  }
  createWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
