# Canvascape - Project Memory Document

## What is Canvascape?
Canvascape is a Windows-first infinite-canvas browser workspace. Instead of tab strips, websites are represented as movable and resizable cards on a spatial canvas.

## Vision
- Bring the "spatial browser" workflow to Windows in a native Electron app.
- Keep a premium dual-theme UI (dark and light) with a warm amber accent system.
- Support project-style browsing with categories, groups, and persistent sessions.
- Expand toward assistant features, memory, and command workflows.

## Tech Stack
| Layer | Tech |
|---|---|
| Desktop shell | Electron 29 |
| Frontend | React 18 |
| Canvas engine | React Flow 11 (`reactflow`) |
| State | Zustand |
| Animation | Framer Motion |
| Styling | CSS variables + Tailwind utility support |
| Bundler | Vite 5 |
| Package manager | npm |

Project path: `C:\Users\rohit\Documents\Canvascape`

## Current Structure
```
Canvascape/
|-- electron/
|   |-- main.js
|   `-- preload.js
|-- src/
|   |-- App.jsx
|   |-- main.jsx
|   |-- store/workspaceStore.js
|   |-- styles/globals.css
|   |-- hooks/useContextMenu.js
|   |-- utils/
|   |   |-- debounce.js
|   |   `-- urlUtils.js
|   `-- components/
|       |-- Canvas/
|       |   |-- CanvasWorkspace.jsx
|       |   `-- CanvasContextMenu.jsx
|       |-- Nodes/
|       |   |-- WebNode.jsx
|       |   `-- WebNodeHeader.jsx
|       |-- Groups/GroupFrame.jsx
|       |-- Sidebar/CanvasSidebar.jsx
|       `-- UI/
|           |-- BottomBar.jsx
|           |-- BottomComposer.jsx (legacy, not mounted by App.jsx)
|           |-- FloatingSearchBar.jsx
|           |-- LoadingScreen.jsx
|           `-- WorkspaceToolbar.jsx
|-- workspace.json (local dev data in repo root)
|-- package.json
|-- vite.config.js
`-- tailwind.config.js
```

## Architecture Notes

### Electron
- `electron/main.js` creates a single-instance app window and enables `webviewTag`.
- Workspace persistence is saved to:
  - `C:\Users\<user>\Documents\Canvascape\workspace.json` (via IPC).
- `did-attach-webview` handlers harden navigation:
  - external popups open in system browser;
  - non-http(s) main-frame navigation is blocked (except `about:blank`).

### Preload Bridge
- `electron/preload.js` exposes:
  - `window.canvascape.workspace.load()`
  - `window.canvascape.workspace.save(data)`
  - `window.canvascape.workspace.getPath()`
  - `window.canvascape.platform`

### Frontend State + Canvas
- `workspaceStore.js` is the central state layer for:
  - node/edge state, viewport, active node, categories, filter, sidebar/composer state, theme.
- `CanvasWorkspace.jsx` wires React Flow behaviors:
  - pan/zoom, minimap, dot background, context menu.
- Cross-component canvas commands use window events:
  - `canvas:fitview`
  - `canvas:flyto`

## Theme System
- Theme is controlled by `data-theme` on `document.documentElement`.
- Store key: `theme` (`dark` or `light`).
- Theme is persisted in workspace JSON (`version: 2` payload).

### Core CSS Tokens
- Surface: `--bg`, `--canvas`, `--s1`, `--s2`, `--s3`, `--s4`, `--glass`
- Borders: `--bd`, `--bd-h`, `--bd-a`
- Text: `--t1`, `--t2`, `--t3`, `--t4`
- Accent: `--a`, `--a2`, `--a-dim`, `--a-bg`, `--a-bg2`, `--a-glow`
- Effects: `--dot`, `--sh-card`, `--sh-active`, `--sh-panel`, `--sh-pill`

### Current Palette Direction
- Dark: near-black warm neutrals with amber accent.
- Light: off-white warm neutrals with amber accent.

## Implemented Features
- Infinite canvas with drag, pan, zoom, minimap, and fit-to-view.
- Web cards rendered with Electron `webview`.
- Card resize (`NodeResizer`) with per-node persisted dimensions.
- Node z-order focus handling via `activeNodeId` and explicit `zIndex`.
- Node header traffic lights:
  - close card
  - minimize to compact tile
  - reload
- Minimized tile mode with restore behavior and favicon/title summary.
- Sidebar workspace tree:
  - uncategorized section
  - category expand/collapse
  - add/rename/delete category
  - add tab into specific category
  - pin/unpin from row action
- Bottom command bar:
  - open composer
  - quick-open presets
  - category selection at open time
  - sidebar toggle
  - fit-view trigger
  - theme toggle
- Canvas context menu:
  - new website
  - new group
  - new category
  - duplicate node
  - pin/unpin node
  - close node
- Group frames (`groupFrame`) with editable title, color cycling, and resize.
- Time filters (`all`, `week`, `today`) that dim old web nodes.
- Keyboard shortcuts:
  - `Ctrl+N` / `Cmd+N`: open composer
  - `Ctrl+\` / `Cmd+\`: toggle sidebar
- Persistence:
  - nodes, edges, viewport, categories, theme, version, timestamp.
- Windows title bar integration with `window.canvascape.platform`.

## Known Issues / Tech Debt
- Repository has mixed/legacy encoding artifacts in some source comments and symbol strings.
- `BottomComposer.jsx` appears legacy and is not mounted in `App.jsx`.
- `FloatingSearchBar.jsx` exists but is not part of the active shell.
- `CanvasContextMenu.jsx` currently uses a light-styled palette; not fully theme-tokenized.
- No automated tests are present for store logic or Electron IPC flow.
- Persistence file location differs between:
  - local repo root `workspace.json` (dev artifact), and
  - actual runtime save path in user Documents folder.

## Roadmap (Next)
- Command palette (`Ctrl+K`) for actions/search.
- Session history and restore presets.
- Card notes/annotations.
- Tab stacks per card.
- Better grouped workspace controls.
- AI assistant side panel with workspace-aware context.

## Session Log
| Date | Changes |
|---|---|
| 2026-03-02 | Initial project memory file created. |
| 2026-03-02 | v3/v4 UI iterations documented (theme system, minimize tile, traffic-light controls, input and pan behavior updates). |
| 2026-03-02 | Document refreshed to match current codebase structure, active components, theme tokens, implemented features, and known tech debt. |

---
This file is the working memory for the project and should be updated after significant architecture or UI changes.
