## 1. Main Process — IPC & Timer Infrastructure

- [x] 1.1 Add in-memory `Map<entryId, timeoutHandle>` (`activeSnoozes`) to `main.js`
- [x] 1.2 Implement `set-snooze` IPC handler: receives `{ id, durationMs }`, clears any existing timer for that id, sets a new `setTimeout`, stores handle in `activeSnoozes`
- [x] 1.3 Implement `cancel-snooze` IPC handler: clears the timer for the given id and removes it from `activeSnoozes`
- [x] 1.4 On snooze expiry: create an Electron `Notification` with title "Clipboard Reminder" and body = first 80 chars of item content; call `notification.show()`
- [x] 1.5 On notification `click` event: call `mainWindow.show()` + `mainWindow.focus()`, then send `snooze-expired` IPC event with `{ id }` to the renderer
- [x] 1.6 Implement `get-active-snoozes` IPC handler: returns a map of `{ id → expiresAt }` so the renderer can restore indicators after reload

## 2. Preload — Bridge Exposure

- [x] 2.1 Expose `snoozeEntry(id, durationMs)` via `contextBridge` → invokes `set-snooze`
- [x] 2.2 Expose `cancelSnooze(id)` via `contextBridge` → invokes `cancel-snooze`
- [x] 2.3 Expose `onSnoozeExpired(callback)` via `contextBridge` → listens on `snooze-expired` IPC event
- [x] 2.4 Expose `getActiveSnoozes()` via `contextBridge` → invokes `get-active-snoozes`

## 3. Renderer — Snooze Duration Picker Modal

- [x] 3.1 Create `SnoozeModal` component with preset buttons (5 min, 15 min, 30 min, 1 hr) and a custom duration input (number + unit selector)
- [x] 3.2 Modal confirms and calls `window.electronAPI.snoozeEntry(id, durationMs)` then closes
- [x] 3.3 Modal has a Cancel / close action that dismisses without creating a snooze

## 4. Renderer — Snooze State & Indicators

- [x] 4.1 Add `snoozedUntil` state map (`{ [id]: expiresAtMs }`) in `App.jsx`
- [x] 4.2 On mount, call `getActiveSnoozes()` to hydrate `snoozedUntil` (handles reload while snooze is active)
- [x] 4.3 Register `onSnoozeExpired` listener: remove id from `snoozedUntil` state
- [x] 4.4 Display remaining time indicator on each snoozed item (e.g., "Snooze: 14 min"); update display every 30 s using `setInterval`
- [x] 4.5 Add "Cancel Snooze" button on snoozed items that calls `cancelSnooze(id)` and removes id from `snoozedUntil`

## 5. Renderer — Notification Click Focus & Highlight

- [x] 5.1 When `snooze-expired` event arrives, scroll the matching item into view (`scrollIntoView`)
- [x] 5.2 Briefly apply a highlight CSS class to the item (e.g., fade-in yellow background, remove after 2 s)

## 6. Integration — Snooze Button in History List

- [x] 6.1 Add a Snooze button to each history item row (visible on hover or always visible)
- [x] 6.2 Clicking the Snooze button opens `SnoozeModal` with the item's id and content preview
- [x] 6.3 If item is already snoozed, show "Cancel Snooze" instead of "Snooze"
