## ADDED Requirements

### Requirement: User can snooze a clipboard history item
Each clipboard history item SHALL expose a Snooze action. Activating it SHALL present a duration picker. After the chosen duration elapses, the system SHALL fire a native desktop notification referencing the item. The snooze timer lives in memory and SHALL NOT persist across app restarts.

#### Scenario: Open snooze modal
- **WHEN** the user clicks the Snooze button on a history item
- **THEN** a modal dialog opens displaying preset duration options (5 min, 15 min, 30 min, 1 hr) and a custom duration input

#### Scenario: Confirm snooze with preset duration
- **WHEN** the user selects a preset duration and confirms
- **THEN** the modal closes, a snooze timer is started in the main process for that duration, and the item displays a visual indicator with remaining time

#### Scenario: Confirm snooze with custom duration
- **WHEN** the user enters a custom number and unit (minutes or hours) and confirms
- **THEN** the modal closes and the snooze timer is started for the specified duration

#### Scenario: Cancel snooze modal
- **WHEN** the user dismisses the modal without confirming
- **THEN** no snooze is created and the item is unchanged

### Requirement: Desktop notification fires when snooze expires
When a snooze timer expires, the system SHALL fire a native macOS desktop notification containing the beginning of the clipboard item's content as the notification body.

#### Scenario: Notification displayed on expiry
- **WHEN** the snooze timer for an item elapses
- **THEN** a desktop notification appears with a title "Clipboard Reminder" and a body showing the first 80 characters of the item's content

#### Scenario: Notification click focuses item
- **WHEN** the user clicks the desktop notification
- **THEN** the app window is brought to focus and the corresponding clipboard item is scrolled into view and briefly highlighted

### Requirement: Snoozed item shows remaining time indicator
While a snooze is active, the item in the history list SHALL display the approximate remaining time (e.g., "Snooze: 14 min") so the user knows it is snoozed.

#### Scenario: Indicator visible during snooze
- **WHEN** an item has an active snooze
- **THEN** a time indicator is visible on the item in the history list

#### Scenario: Indicator removed after expiry
- **WHEN** the snooze expires and the notification fires
- **THEN** the time indicator is removed from the item

### Requirement: User can cancel an active snooze
A snoozed item SHALL expose a cancel action that stops the timer before it fires.

#### Scenario: Cancel active snooze
- **WHEN** the user clicks "Cancel Snooze" on an item with an active snooze
- **THEN** the timer is cleared, no notification is fired, and the snooze indicator is removed from the item
