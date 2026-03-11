# ClipDB

A macOS clipboard history manager built with Electron + React. Monitors the system clipboard every second and persists entries (text, images, and files) in a local SQLite database.

## Download

Go to the [Releases](https://github.com/mateusdeitos/clipbh/releases) page and download the `.dmg` for your Mac:

- **Apple Silicon (M1/M2/M3/M4)** → `ClipDB-x.x.x-arm64.dmg`
- **Intel** → `ClipDB-x.x.x.dmg`

> **Note:** The app is not signed. If macOS says it's "damaged", run this in Terminal and reopen:
> ```bash
> xattr -cr /Applications/ClipDB.app
> ```

You also need to grant **Accessibility** permission so the app can monitor the clipboard without restrictions: **System Settings → Privacy & Security → Accessibility**.

## Features

- Clipboard history for text, images, and files
- Full-text and tag search
- Tag management per entry
- Copy any entry back to clipboard with one click
- Pause/resume clipboard monitoring
- Persistent SQLite storage (survives restarts)

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build DMG for distribution
npm run build:mac
```

## Tech Stack

- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [sql.js](https://sql.js.org/) (SQLite via WASM)
- [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com/)
