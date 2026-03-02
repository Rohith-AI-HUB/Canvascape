const { app, BrowserWindow, ipcMain, shell, session, Menu, MenuItem } = require('electron')

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
const path = require('path')
const fs = require('fs')
const os = require('os')

const isDev = !app.isPackaged

// ─── Desktop UA ───────────────────────────────────────────────────────────────
// A real Windows desktop Chrome UA. This tells every website to render its full
// laptop layout — no mobile, no tablet, no "lite" version.
const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/124.0.0.0 Safari/537.36'

// ─── Persistence path ─────────────────────────────────────────────────────────
const WORKSPACE_DIR  = path.join(os.homedir(), 'Documents', 'Canvascape')
const WORKSPACE_FILE = path.join(WORKSPACE_DIR, 'workspace.json')

function ensureWorkspaceDir() {
  if (!fs.existsSync(WORKSPACE_DIR)) {
    fs.mkdirSync(WORKSPACE_DIR, { recursive: true })
  }
}

// ─── Window creation ──────────────────────────────────────────────────────────
let mainWindow

function createWindow() {
  // Set UA on the partition SESSION before any webview is created.
  // Every HTTP request from every webview using 'persist:canvascape' carries
  // the desktop UA from byte one — before did-attach-webview even fires.
  const webviewSession = session.fromPartition('persist:canvascape')
  webviewSession.setUserAgent(DESKTOP_UA)

  // Strip client-hint headers that reveal a touch/small viewport to servers.
  webviewSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...details.requestHeaders }
    delete headers['Sec-CH-UA-Mobile']
    delete headers['Sec-CH-UA-Platform-Version']
    delete headers['Viewport-Width']
    delete headers['Width']
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
      zoomFactor: 1.0,
    },
  })

  mainWindow.webContents.setZoomFactor(1.0)
  mainWindow.webContents.setZoomLevel(0)

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // ── will-attach-webview: set UA before the process is created ─────────────
  mainWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    webPreferences.userAgent = DESKTOP_UA
    params.partition = 'persist:canvascape'
  })

  // ── did-attach-webview: belt-and-suspenders UA + all interaction wiring ────
  mainWindow.webContents.on('did-attach-webview', (event, webContents) => {

    // Override UA one final time after attach — covers edge cases where
    // will-attach-webview wasn't honoured by the running Electron version.
    webContents.setUserAgent(DESKTOP_UA)

    // ── Right-click context menu ──────────────────────────────────────────────
    // Electron webviews do NOT show any context menu by default. The 'context-menu'
    // event fires with rich information about what was clicked (link, image, text
    // selection, editable field, etc.). We build a native Menu from that data.
    webContents.on('context-menu', (e, params) => {
      const menu = new Menu()

      // ── Editable field (input, textarea) ─────────────────────────────────
      if (params.isEditable) {
        if (params.selectionText) {
          menu.append(new MenuItem({ label: 'Cut',   role: 'cut'   }))
          menu.append(new MenuItem({ label: 'Copy',  role: 'copy'  }))
        }
        menu.append(new MenuItem({ label: 'Paste', role: 'paste' }))
        menu.append(new MenuItem({ label: 'Select All', role: 'selectAll' }))
        menu.append(new MenuItem({ type: 'separator' }))
      }

      // ── Text selection ────────────────────────────────────────────────────
      if (params.selectionText && !params.isEditable) {
        menu.append(new MenuItem({ label: 'Copy', role: 'copy' }))
        menu.append(new MenuItem({
          label: 'Search Google for "' + params.selectionText.slice(0, 30) + (params.selectionText.length > 30 ? '…' : '') + '"',
          click: () => shell.openExternal(
            `https://www.google.com/search?q=${encodeURIComponent(params.selectionText)}`
          ),
        }))
        menu.append(new MenuItem({ type: 'separator' }))
      }

      // ── Hyperlink ─────────────────────────────────────────────────────────
      if (params.linkURL) {
        menu.append(new MenuItem({
          label: 'Open Link in New Tab',
          click: () => {
            // Fire the custom event so Canvascape opens a new webNode card
            mainWindow.webContents.executeJavaScript(
              `window.dispatchEvent(new CustomEvent('canvas:openurl', { detail: { url: ${JSON.stringify(params.linkURL)} } }))`
            ).catch(() => {})
          },
        }))
        menu.append(new MenuItem({
          label: 'Open Link in Browser',
          click: () => shell.openExternal(params.linkURL).catch(() => {}),
        }))
        menu.append(new MenuItem({
          label: 'Copy Link URL',
          click: () => { require('electron').clipboard.writeText(params.linkURL) },
        }))
        menu.append(new MenuItem({ type: 'separator' }))
      }

      // ── Image ─────────────────────────────────────────────────────────────
      if (params.mediaType === 'image' && params.srcURL) {
        menu.append(new MenuItem({
          label: 'Open Image in Browser',
          click: () => shell.openExternal(params.srcURL).catch(() => {}),
        }))
        menu.append(new MenuItem({
          label: 'Copy Image URL',
          click: () => { require('electron').clipboard.writeText(params.srcURL) },
        }))
        menu.append(new MenuItem({ type: 'separator' }))
      }

      // ── Navigation ────────────────────────────────────────────────────────
      menu.append(new MenuItem({
        label: 'Back',
        enabled: webContents.navigationHistory?.canGoBack?.() ?? false,
        click:   () => webContents.goBack(),
      }))
      menu.append(new MenuItem({
        label: 'Forward',
        enabled: webContents.navigationHistory?.canGoForward?.() ?? false,
        click:   () => webContents.goForward(),
      }))
      menu.append(new MenuItem({
        label: 'Reload',
        click: () => webContents.reload(),
      }))

      menu.append(new MenuItem({ type: 'separator' }))

      // ── Clipboard / misc ──────────────────────────────────────────────────
      menu.append(new MenuItem({
        label: 'Copy Page URL',
        click: () => { require('electron').clipboard.writeText(webContents.getURL()) },
      }))
      menu.append(new MenuItem({
        label: 'Open Page in Browser',
        click: () => shell.openExternal(webContents.getURL()).catch(() => {}),
      }))

      menu.popup({ window: mainWindow })
    })

    // ── window.open → open in system browser ──────────────────────────────────
    webContents.setWindowOpenHandler(({ url }) => {
      if (url?.startsWith('http://') || url?.startsWith('https://')) {
        shell.openExternal(url).catch(() => {})
      }
      return { action: 'deny' }
    })

    // ── Navigation guard ──────────────────────────────────────────────────────
    webContents.on('will-navigate', (e, url) => {
      if (
        !url.startsWith('http://') &&
        !url.startsWith('https://') &&
        url !== 'about:blank'
      ) {
        e.preventDefault()
      }
    })

    // ── Load failure logging ──────────────────────────────────────────────────
    webContents.on('did-fail-load', (_e, errorCode, _errorDescription, validatedURL, isMainFrame) => {
      if (errorCode === -3) return   // ERR_ABORTED — expected on redirects
      if (!isMainFrame) return
      console.warn(`Webview load failed (${errorCode}) for ${validatedURL}`)
    })
  })
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  ensureWorkspaceDir()
  createWindow()

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

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
