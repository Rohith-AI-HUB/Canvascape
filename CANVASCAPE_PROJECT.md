# 🌌 Canvascape — Project Memory Document

> **What is Canvascape?**
> Canvascape is a Windows-native infinite canvas browser — Nimo Infinity, but for Windows, built in Rohit's style. It replaces browser tabs with floating web cards on an infinite spatial canvas.

---

## 🎯 Vision

- **Nimo Infinity** is Mac-only. Canvascape brings the same concept to Windows.
- Beautiful, premium **dark** UI — spatial, intelligent, productive.
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
├── src/
│   ├── App.jsx         # Root shell, titlebar, layout
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
│   │   └── globals.css # All CSS variables + custom classes
│   └── utils/          # urlUtils.js
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## 🎨 Design System

### Color Palette (Dark Theme — UNIFIED v3)
```
Background:   #0E0E12  (near-black — canvas + sidebar + bottom bar all same)
Surface-1:    #141417  (card/panel bg, WebNode cards)
Surface-2:    #1C1C24  (elevated: inputs, composer field)
Surface-3:    #24242E  (hover states)
Border:       rgba(255,255,255,0.055)
Border Hover: rgba(255,255,255,0.13)
Border Focus: rgba(139,92,246,0.45)
Accent:       #8B5CF6  (electric violet — brand)
Accent Soft:  #A78BFA
Accent Bright:#C4B5FD
Accent Dim:   rgba(139,92,246,0.08-0.2)
Text-1:       #E8E6F0  (primary — near white)
Text-2:       #9C99AC  (secondary — muted violet-grey)
Text-3:       #6B6880  (tertiary — dimmer)
Hint:         #3A3750  (very dim, labels only)
Shadow-deep:  #2E2C3A  (near invisible labels)
Success:      #34D399
Error:        #F87171
```

### Typography
- **UI font:** `DM Sans` (loaded via Google Fonts)
- **Mono:** `JetBrains Mono` for URL bar inputs
- **Headers:** `Space Grotesk` 600

### Design Language
- **Canvas background:** Pure `#0E0E12` with subtle dot grid (`rgba(255,255,255,0.07)`)
- **Sidebar:** Same `#0E0E12` — blends seamlessly into canvas
- **Cards (WebNode):** `#141417` bg, violet glow ring when active
- **Active state:** `box-shadow: 0 0 0 1.5px rgba(123,97,255,0.6), 0 0 30px rgba(123,97,255,0.15)`
- **Borders:** `rgba(255,255,255,0.055–0.07)` ultra-thin
- **Buttons:** Violet-tinted with hover glow
- **WebNode header:** macOS-style traffic lights (red/yellow/green), dark `#141417` bg
- **Titlebar (Win32):** `#0A0A0D` — slightly darker than canvas for hierarchy
- **Transitions:** 130–200ms ease
- **Composer panel:** Glass-morphism, violet top-glow gradient line

### Key UI Decisions
- Sidebar = same bg as canvas → seamless spatial feel (Nimo-style)
- No harsh light surfaces anywhere
- Category dots have `box-shadow` glow matching their color
- Online status indicator (green dot) in sidebar footer
- "Spaces" label above category tree (like Nimo naming)

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
| Dark premium UI redesign (v3 — unified dark) | ✅ |
| Persistent storage (workspace.json) | ✅ |
| macOS-style traffic lights on WebNode | ✅ |
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

- `WinTitleBar` only renders if `window.canvascape.platform === 'win32'` — ensure Electron preload exposes this.
- `ReactFlow` controls hidden via CSS; custom zoom/fit wired via `useReactFlow`.
- `canvas:flyto` and `canvas:fitview` use `window.dispatchEvent` for cross-provider communication.
- BottomBar uses `setComposerOpen` from outside ReactFlowProvider — intentional.
- Category delete button has `opacity: 0` by default (requires hover on row to appear) — CSS group-hover not available in inline styles; currently using JS onMouseEnter/Leave which doesn't cascade. May need CSS class.

---

## 📝 Session Log

| Date | Changes |
|------|---------|
| 2026-03-02 | Initial project review. Dark premium UI redesign (v2). Created project document. |
| 2026-03-02 | **UI v3 — Unified Dark Overhaul.** Sidebar, WebNodeHeader, WorkspaceToolbar, App WinTitleBar all converted to consistent dark theme. macOS traffic lights added to WebNode. Category dot glow, "Spaces" label, status dot in sidebar footer. All light/cream surfaces eliminated. |

---

*This document is Claude's memory for the Canvascape project. Update after every significant session.*
