# 🌌 Canvascape — Project Memory Document

> **What is Canvascape?**
> Canvascape is a Windows-native infinite canvas browser — Nimo Infinity, but for Windows, built in Rohit's style. It replaces browser tabs with floating web cards on an infinite spatial canvas.

---

## 🎯 Vision

- **Nimo Infinity** is Mac-only. Canvascape brings the same concept to Windows.
- Beautiful, premium **dark AND light** UI — spatial, intelligent, productive.
- Cards (webviews) float on an infinite canvas. You drag, resize, group, and organize them.
- Future: AI assistant, dynamic apps, MCP integrations, memory.

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Electron 29 + React 18 |
| Canvas | ReactFlow (reactflow 11) |
| Animations | Framer Motion |
| State | Zustand |
| Styling | Tailwind CSS + CSS variables |
| Bundler | Vite |
| Package | npm |

**Project Path:** `C:\Users\rohit\Documents\Canvascape`

---

## 📁 Project Structure

```
Canvascape/
├── electron/           # Electron main process
│   └── main.js         # GPU flags, window creation, IPC
├── src/
│   ├── App.jsx         # Root shell, titlebar, layout, theme provider
│   ├── main.jsx        # React entry
│   ├── components/
│   │   ├── Canvas/     # CanvasWorkspace.jsx (ReactFlow)
│   │   ├── Groups/     # Group node
│   │   ├── Nodes/      # WebNode.jsx, WebNodeHeader.jsx
│   │   ├── Sidebar/    # CanvasSidebar.jsx
│   │   └── UI/         # BottomBar, WorkspaceToolbar, LoadingScreen
│   ├── hooks/
│   ├── store/          # workspaceStore.js (Zustand)
│   ├── styles/
│   │   └── globals.css # CSS variables (dark/light) + all component styles
│   └── utils/          # urlUtils.js, debounce.js
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## 🎨 Design System

### Theme System
- Controlled via `data-theme="dark"` or `data-theme="light"` on `<html>`
- Set by `toggleTheme()` in workspaceStore — persisted to workspace.json
- CSS variables defined in `globals.css` under `:root, [data-theme="dark"]` and `[data-theme="light"]`
- Theme toggle button (sun/moon icon) in sidebar header

### CSS Variables (key ones)
```
--c-canvas       Canvas/app background
--c-bg           Same as canvas
--c-surface      Card/panel background
--c-surface2     Inputs, elevated surfaces
--c-surface3     Hover states
--c-glass        Backdrop-filtered surfaces (bottom bar, composer)
--c-border       Default border (rgba white/violet ~7%)
--c-border-h     Hover border
--c-border-a     Active/focus border (violet 55%)
--c-text         Primary text
--c-text2        Secondary text
--c-muted        Tertiary/placeholder
--c-soft         Disabled/very dim
--c-accent       Brand violet #7B61FF
--c-accent2      Soft violet #A78BFA
--c-accent-bg    Accent background tint
--c-header       WebNode header bg
--c-header-a     WebNode header bg (active)
--c-dot          Canvas dot grid color
```

### Dark Theme Colors
```
Canvas:   #0D0D0F   Surface: #141417   Surface2: #1C1C21
Text:     #F0EEFF   Muted:   #6B6880   Soft:     #3A3750
Accent:   #7B61FF   Accent2: #A78BFA
```

### Light Theme Colors
```
Canvas:   #F2F0F8   Surface: #FFFFFF    Surface2: #F5F3FC
Text:     #1A1628   Muted:   #8B83A8   Soft:     #C4BEDC
Accent:   #7B61FF   Accent2: #6B50F0
```

### Design Language
- macOS-style traffic lights on WebNode (14px, with hover SVG icons)
- Red = Close card, Yellow = Minimize to app card, Green = Reload
- Traffic light icons appear on group hover (`tlHover` state)
- Sidebar seamlessly blends into canvas background
- CSS `data-theme` attribute drives all theming

---

## ✅ Features Implemented

| Feature | Status |
|---------|--------|
| Infinite canvas with drag/pan/zoom | ✅ |
| WebView cards (Electron webview) | ✅ |
| Card resizing (NodeResizer) | ✅ |
| Sidebar with categories/spaces | ✅ |
| Pin cards | ✅ |
| Bottom bar + composer (URL opener) | ✅ |
| Quick-open sites | ✅ |
| Filter by time (All/Week/Today) | ✅ |
| Zoom controls | ✅ |
| Fit-to-view | ✅ |
| Loading bar | ✅ |
| Windows custom titlebar | ✅ |
| Dark premium UI | ✅ |
| **Light theme** | ✅ (v4) |
| **Theme toggle** (sidebar header) | ✅ (v4) |
| **Minimize to app card** (yellow button) | ✅ (v4) |
| **Traffic lights with SVG icons** | ✅ (v4) |
| **Trackpad two-finger pan fix** | ✅ (v4) |
| **Webview blur fix** (GPU flags) | ✅ (v4) |
| Persistent storage (workspace.json) | ✅ |
| Context menu | ✅ |

---

## 🚀 Nimo Features To Implement (Roadmap)

| Feature | Priority | Notes |
|---------|----------|-------|
| **Card groups / workspaces** | High | Group cards by project on canvas |
| **AI assistant (chat panel)** | High | Sidebar AI chat, context-aware |
| **Command palette** (Ctrl+K) | High | Quick actions, search, jump |
| **Card context memory** | Medium | Remember what was open |
| **History / sessions** | Medium | Resume previous layouts |
| **Card notes / annotations** | Medium | Sticky notes on canvas |
| **Picture-in-picture cards** | Medium | Mini floating webview |
| **Tab stacking inside card** | Medium | Multiple URLs in one card |
| **Keyboard shortcut panel** | Low | Show all shortcuts |
| **Card sharing / export** | Low | Share card URLs as layout |
| **Canvas themes** | Low | Multiple color themes |
| **Spotlight search** | Low | Find cards by content/title |

---

## 💡 Rohit's Custom Ideas (Add here as they come)

_(Rohit will add ideas in future sessions — Claude should refer to this section)_

---

## 🔧 Known Issues / Tech Debt

- `WinTitleBar` in App.jsx only renders if `window.canvascape.platform === 'win32'` — ensure Electron preload exposes this.
- `ReactFlow` controls hidden via CSS; custom zoom/fit wired via `useReactFlow`.
- `canvas:flyto` and `canvas:fitview` use `window.dispatchEvent` for cross-provider communication.
- BottomBar uses `setComposerOpen` from outside ReactFlowProvider — intentional.
- `panOnScroll=true` + `zoomOnScroll=false` = trackpad two-finger swipe = PAN. Ctrl+scroll = zoom (browser default). This is correct behavior.
- Webview blur fix: `force-device-scale-factor=1` in main.js may affect HiDPI sharpness on some monitors — if text looks oversized, remove that flag.
- Theme is stored in workspace.json and applied on `loadWorkspace()`. On first run (no saved file), defaults to dark.

---

## 📝 Session Log

| Date | Changes |
|------|---------|
| 2026-03-02 | Initial project review. Dark premium UI redesign (v2). Created project document. |
| 2026-03-02 | UI v3 — Unified Dark Overhaul. Sidebar, WebNodeHeader, WorkspaceToolbar all dark. macOS traffic lights added. |
| 2026-03-02 | **UI v4 — Light/Dark theme system, minimize-to-card, traffic light icons, trackpad pan fix, webview blur fix.** |

---

*This document is Claude's memory for the Canvascape project. Update after every significant session.*
