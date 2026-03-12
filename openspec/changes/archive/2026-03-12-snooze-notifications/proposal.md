## Why

Users often copy items to the clipboard and need to be reminded about them later — a common pattern when planning to act on a piece of content after a delay. Without snooze, clipboard entries can be forgotten or buried in history.

## What Changes

- Each clipboard history item gains a **Snooze** button in the UI
- Clicking Snooze opens a modal to select a snooze duration (e.g., 5 min, 15 min, 1 hr, custom)
- After the timer expires, a macOS desktop notification fires for that item
- Clicking the notification brings the app to focus and highlights the snoozed item in the list
- Snoozed items display a visual indicator showing remaining time

## Capabilities

### New Capabilities

- `snooze-item`: Allows a clipboard history entry to be snoozed for a user-specified duration, firing a desktop notification when the timer expires and focusing the item when the notification is clicked

### Modified Capabilities

<!-- None — no existing spec-level behavior is changing -->

## Impact

- `main.js`: New IPC handlers for setting and cancelling snoozes; manages active timers via `setTimeout`; fires `Notification` (Electron) when timers expire
- `preload.js`: Exposes `snoozeEntry`, `cancelSnooze` methods via `contextBridge`
- `src/App.jsx`: Adds Snooze button per item, snooze duration picker modal, snoozed-item indicator, and focus/scroll-to behavior on notification click
- No new dependencies required (Electron's built-in `Notification` API handles desktop notifications)
