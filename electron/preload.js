const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('canvascape', {
  workspace: {
    load: () => ipcRenderer.invoke('workspace:load'),
    save: (data) => ipcRenderer.invoke('workspace:save', data),
    getPath: () => ipcRenderer.invoke('workspace:getPath'),
  },
  app: {
    close:    () => ipcRenderer.send('window:close'),
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
  },
  platform: process.platform,
})
