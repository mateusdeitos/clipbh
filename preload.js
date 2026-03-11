/**
 * preload.js - Ponte de comunicação segura
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getHistory: (searchQuery) => ipcRenderer.invoke('get-history', searchQuery),
  deleteEntry: (id) => ipcRenderer.invoke('delete-entry', id),
  updateTags: (id, tags) => ipcRenderer.invoke('update-tags', id, tags),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  copyToOS: (type, content) => ipcRenderer.send('copy-to-os', type, content),
  getWatchStatus: () => ipcRenderer.invoke('get-watch-status'),
  toggleWatch: () => ipcRenderer.invoke('toggle-clipboard-watch'),
  onClipboardUpdate: (callback) => {
    const handler = (event, item) => callback(item);
    ipcRenderer.on('clipboard-update', handler);
    return () => ipcRenderer.removeListener('clipboard-update', handler);
  }
});
