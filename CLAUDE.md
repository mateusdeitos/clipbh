# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**clipbh** (ClipDB) is a macOS clipboard history manager built with Electron + React + Vite. It monitors the system clipboard every second, persists entries (text and images) in a SQLite database via `sql.js` (WASM-based), and displays them in a React UI.

## Commands

```bash
# Development (runs Vite dev server + Electron simultaneously)
npm run dev

# Build for distribution (.dmg)
npm run build

# Run only the Vite dev server (port 5173)
npm run vite:dev

# Run only the Electron process
npm run electron:dev
```

There are no tests or linters configured.

## Architecture

The app follows the standard Electron two-process model:

**Main Process (`main.js`)**
- Initializes `sql.js` (WASM SQLite) and loads/creates `clipboard_history.wasm.db` in the OS `userData` directory
- Polls the clipboard every 1 second for text and image changes
- On new clipboard content, inserts into the DB, saves to disk, and pushes a `clipboard-update` IPC event to the renderer
- Exposes IPC handlers: `get-history`, `delete-entry`, `update-tags`, `clear-history`, `copy-to-os`

**Preload (`preload.js`)**
- Bridges the main and renderer processes via `contextBridge`, exposing `window.electronAPI` with methods corresponding to each IPC handler

**Renderer Process (`src/App.jsx`)**
- Single React component that loads history on mount via `window.electronAPI.getHistory()`
- Listens for real-time updates via `window.electronAPI.onClipboardUpdate()`
- Supports search (by content and tags), tag management (add/remove per entry), delete, copy-back-to-clipboard, and a widget/transparent overlay mode
- History is grouped by date for display

**Dev vs Production**
- In dev (`isDev = !app.isPackaged`), Electron loads `http://localhost:5173` (Vite dev server)
- In production, Electron loads `dist/index.html` (Vite build output)

**Database**
- `sql.js` runs SQLite entirely in WASM — no native bindings needed
- The DB is read into memory on startup and written to disk (`fs.writeFileSync`) after every mutation
- Schema: `history(id, type, content, timestamp, tags)` — `tags` is stored as a JSON string

## macOS Note

The app requires Accessibility permissions to monitor the clipboard without restrictions. Grant access in System Settings > Privacy & Security > Accessibility.
