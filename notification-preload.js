const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('notificationAPI', {
  dismiss: () => ipcRenderer.send('notification-dismiss'),
  focusItem: () => ipcRenderer.send('notification-focus-item'),
  getItemData: (id) => ipcRenderer.invoke('get-notification-data', id),
  resize: (height) => ipcRenderer.send('notification-resize', height),
});
