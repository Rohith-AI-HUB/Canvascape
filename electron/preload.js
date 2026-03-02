const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('canvascape', {
  workspace: {
    load: () => ipcRenderer.invoke('workspace:load'),
    save: (data) => ipcRenderer.invoke('workspace:save', data),
    getPath: () => ipcRenderer.invoke('workspace:getPath'),
  },
  platform: process.platform,
})
