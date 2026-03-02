const { app, BrowserWindow, ipcMain, shell, session } = require('electron')

// Ensure only one instance of the app runs at a time
if (!app.requestSingleInstanceLock()) {
  app.quit()
}

// ── Sharp rendering on Windows HiDPI ─────────────────────────────────────────
// Must be called BEFORE app is ready
app.commandLine.appendSwitch('force-color-profile', 'srgb')
app.commandLine.appendSwitch('high-dpi-support', '1')
app.commandLine.appendSwitch('enable-font-antialiasing')
app.commandLine.appendSwitch('enable-lcd-text')
// Let Windows handle DPI — do NOT force scale factor (causes blur)
// Do NOT add use-angle or disable-gpu flags — they cause blur on most Windows GPUs
const path = require('path')
const fs = require('fs')
const os = require('os')

// In dev: app is never packaged, so isPackaged is always false locally
const isDev = !app.isPackaged

// ─── Desktop UA — used at session level AND per-webview ───────────────────────
// A real Windows desktop Chrome UA. This is what tells every website to render
// its full laptop layout — no mobile, no tablet, no "lite" version.
const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/124.0.0.0 Safari/537.36'

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
  // ── Set UA on the partition SESSION before any webview is created ───────────
  // This is the earliest possible moment — every HTTP request from every webview
  // using 'persist:canvascape' will carry the desktop UA from byte one, including
  // the very first navigation that fires before did-attach-webview.
  const webviewSession = session.fromPartition('persist:canvascape')
  webviewSession.setUserAgent(DESKTOP_UA)

  // Disable Accept-CH client hints so servers can't fingerprint the viewport
  // size and serve a narrower layout. This keeps every site in full desktop mode.
  webviewSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...details.requestHeaders }
    // Strip client hints that reveal a small/touch viewport
    delete headers['Sec-CH-UA-Mobile']
    delete headers['Sec-CH-UA-Platform-Version']
    delete headers['Viewport-Width']
    delete headers['Width']
    // Force desktop UA on every outbound request (belt-and-suspenders)
    headers['User-Agent'] = DESKTOP_UA
    callback({ requestHeaders: headers })
  })

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

  // ── Webview hardening + UA enforcement ────────────────────────────────────
  mainWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    // Set UA on webPreferences here — this fires BEFORE the webview process
    // is created, so the first request goes out with the desktop UA already set.
    webPreferences.userAgent = DESKTOP_UA
    // Ensure the webview inherits the correct partition for our session
    params.partition = 'persist:canvascape'
  })

  mainWindow.webContents.on('did-attach-webview', (event, webContents) => {
    // Belt-and-suspenders: override again after attach in case the attribute
    // or will-attach handler was not honoured by Electron's version in use.
    webContents.setUserAgent(DESKTOP_UA)

    // Inject a one-time script after every page load to guarantee the page
    // sees a desktop viewport. This overrides any <meta name="viewport"> that
    // tries to set a narrow width.
    webContents.on('did-finish-load', () => {
      webContents.executeJavaScript(`
        (function() {
          // Remove any viewport meta that declares width < 1024
          var metas = document.querySelectorAll('meta[name="viewport"]');
          metas.forEach(function(m) {
            var c = m.getAttribute('content') || '';
            if (/width=device-width/i.test(c) || /width=\\d{1,3}(?!\\d)/i.test(c)) {
              m.setAttribute('content',
                'width=1280, initial-scale=1.0, maximum-scale=1.0');
            }
          });
        })();
      `).catch(() => {})
    })

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
