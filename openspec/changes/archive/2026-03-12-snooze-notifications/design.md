## Context

clipbh is an Electron + React app. The main process owns the clipboard poll loop and the SQLite DB (via sql.js WASM). The renderer communicates through a `contextBridge` preload. There is currently no timer or notification infrastructure.

Electron exposes a built-in `Notification` API in the main process that maps to native macOS notifications — no external dependency is needed.

## Goals / Non-Goals

**Goals:**
- Let users snooze any clipboard history item for a chosen duration
- Fire a native macOS desktop notification when the snooze expires
- Clicking the notification focuses the app and scrolls to / highlights the item
- Show remaining snooze time visually on snoozed items in the list

**Non-Goals:**
- Persisting snooze timers across app restarts (timers live in memory only)
- Supporting multiple simultaneous snoozes on the same item
- Push / remote notifications

## Decisions

### 1. Timer storage: in-memory Map in main process

Snooze timers are held in a `Map<entryId, timeoutHandle>` in `main.js`. On expiry the timeout fires the notification and removes itself from the map.

**Why not persist to DB?** Persisted snoozes would require a background wake mechanism (or polling on startup) and add schema complexity for a feature whose value degrades if the app is not running. In-memory is simpler and sufficient.

**Alternative considered:** Storing snooze deadline in the `history` table. Rejected because it ties ephemeral UI state to durable storage and complicates the schema for no practical gain.

### 2. Notification click → focus item: IPC event from main to renderer

When the user clicks the notification, the main process calls `mainWindow.show()` + `mainWindow.focus()` and emits a `snooze-expired` IPC event carrying the `entryId`. The renderer listens and scrolls to + briefly highlights the item.

**Why IPC and not deep-link?** The app is a single BrowserWindow; IPC is direct and already established as the communication pattern in this codebase.

### 3. Snooze duration UI: modal with preset + custom input

The modal offers quick-pick buttons (5 min, 15 min, 30 min, 1 hr) and a free-form number+unit input for custom durations. This covers 95 % of use cases with one click while remaining flexible.

### 4. No DB schema change needed

Snooze state is transient. The `history` table remains unchanged: `(id, type, content, timestamp, tags)`. Active snoozes are tracked only in the in-memory Map.

## Risks / Trade-offs

- **App-closed snoozes are lost** → Accepted trade-off; documented in UI ("Snooze requires app to be running")
- **Multiple rapid snooze/cancel cycles** → Mitigated by always clearing the existing timeout before setting a new one (idempotent set)
- **macOS notification permissions** → Electron requests notification permission on first use; if denied, the feature silently fails. Mitigation: show an in-app fallback alert as a secondary channel

## Migration Plan

No data migration required. The feature is purely additive with no schema changes.
