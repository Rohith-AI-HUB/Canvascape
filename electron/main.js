const { app, BrowserWindow, ipcMain, session } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

// In dev: app is never packaged, so isPackaged is always false locally
const isDev = !app.isPackaged

// ─── Persistence path ─────────────────────────────────────────────────────────
const WORKSPACE_DIR = path.join(os.homedir(), 'Documents', 'Canvascape')
const WORKSPACE_FILE = path.join(WORKSPACE_DIR, 'workspace.json')

function ensureWorkspaceDir() {
  if (!fs.existsSync(WORKSPACE_DIR)) {
    fs.mkdirSync(WORKSPACE_DIR, { recursive: true })
  }
}

// ─── Window creation ──────────────────────────────────────────────────────────
let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#F5F0EB',
    titleBarStyle: 'hiddenInset',
    frame: process.platform !== 'win32',
    titleBarOverlay: process.platform === 'win32' ? {
      color: '#F5F0EB',
      symbolColor: '#3D3552',
      height: 40,
    } : false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // ── Webview security hardening ────────────────────────────────────────────
  mainWindow.webContents.on('did-attach-webview', (event, webContents) => {
    webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

    webContents.on('will-navigate', (e, url) => {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        e.preventDefault()
      }
    })
  })
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  ensureWorkspaceDir()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ─── IPC: Workspace persistence ───────────────────────────────────────────────
ipcMain.handle('workspace:load', async () => {
  try {
    if (!fs.existsSync(WORKSPACE_FILE)) return null
    const raw = fs.readFileSync(WORKSPACE_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load workspace:', e)
    return null
  }
})

ipcMain.handle('workspace:save', async (event, data) => {
  try {
    ensureWorkspaceDir()
    fs.writeFileSync(WORKSPACE_FILE, JSON.stringify(data, null, 2), 'utf-8')
    return { success: true }
  } catch (e) {
    console.error('Failed to save workspace:', e)
    return { success: false, error: e.message }
  }
})

ipcMain.handle('workspace:getPath', () => WORKSPACE_FILE)
