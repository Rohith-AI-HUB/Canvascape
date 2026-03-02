const { app, BrowserWindow, ipcMain, shell } = require('electron')

// Ensure only one instance of the app runs at a time
if (!app.requestSingleInstanceLock()) {
  app.quit()
}

// ── Sharp rendering on Windows HiDPI ─────────────────────────────────────────
// Must be called BEFORE app is ready
app.commandLine.appendSwitch('force-color-profile', 'srgb')
app.commandLine.appendSwitch('high-dpi-support', '1')
// Let Windows handle DPI — do NOT force scale factor (causes blur)
// Do NOT add use-angle or disable-gpu flags — they cause blur on most Windows GPUs
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
    backgroundColor: '#0D0D0F',
    titleBarStyle: 'hiddenInset',
    frame: process.platform !== 'win32',
    titleBarOverlay: process.platform === 'win32' ? {
      color: '#09090C',
      symbolColor: '#3A3750',
      height: 38,
    } : false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: false,
      // Sharp text rendering
      zoomFactor: 1.0,
    },
  })

  // Force crisp pixel rendering — remove any inherited zoom
  mainWindow.webContents.setZoomFactor(1.0)
  mainWindow.webContents.setZoomLevel(0)

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // ── Webview security hardening ────────────────────────────────────────────
  mainWindow.webContents.on('did-attach-webview', (event, webContents) => {
    webContents.setWindowOpenHandler(({ url }) => {
      if (url?.startsWith('http://') || url?.startsWith('https://')) {
        shell.openExternal(url).catch(() => {})
      }
      return { action: 'deny' }
    })

    webContents.on('will-navigate', (e, url) => {
      // Keep navigation limited to web content plus about:blank transitional pages.
      if (
        !url.startsWith('http://') &&
        !url.startsWith('https://') &&
        url !== 'about:blank'
      ) {
        e.preventDefault()
      }
    })

    webContents.on('did-fail-load', (_e, errorCode, _errorDescription, validatedURL, isMainFrame) => {
      // Chromium ERR_ABORTED (-3) is expected during redirects and popup cancellations.
      if (errorCode === -3) return
      if (!isMainFrame) return
      console.warn(`Webview load failed (${errorCode}) for ${validatedURL}`)
    })
  })
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  ensureWorkspaceDir()
  createWindow()

  // When a second instance tries to launch, focus the existing window instead
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  // macOS: re-show window when clicking dock icon
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
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
