import { app, BrowserWindow, clipboard, ipcMain, nativeImage } from 'electron';
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

let mainWindow;

function createWindow() {
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
  if (!db) return;

  db.run(
    `INSERT INTO history (type, content, tags) VALUES (?, ?, '[]')
     ON CONFLICT (type, content) DO UPDATE SET timestamp = CURRENT_TIMESTAMP`,
    [type, content]
  );
  saveDatabaseToDisk();

  const res = db.exec('SELECT id, timestamp FROM history WHERE type = ? AND content = ?', [type, content]);
  const [id, timestamp] = res[0].values[0];

  sendClipboardUpdate({ id, type, content, tags: [], timestamp: new Date(timestamp) });
}

// Handlers IPC
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
    row.timestamp = new Date(row.timestamp);
    results.push(row);
  }
  stmt.free();
  return results;
});

ipcMain.handle('delete-entry', (event, id) => {
  db.run('DELETE FROM history WHERE id = ?', [id]);
  saveDatabaseToDisk();
});

ipcMain.handle('update-tags', (event, id, tags) => {
  db.run('UPDATE history SET tags = ? WHERE id = ?', [JSON.stringify(tags), id]);
  saveDatabaseToDisk();
});

ipcMain.handle('clear-history', () => {
  db.run('DELETE FROM history');
  saveDatabaseToDisk();
});

ipcMain.on('copy-to-os', (event, type, content) => {
  if (type === 'image') {
    clipboard.writeImage(nativeImage.createFromDataURL(content));
  } else {
    clipboard.writeText(content);
  }
});

app.whenReady().then(async () => {
  await initDatabase();
  createWindow();
});
