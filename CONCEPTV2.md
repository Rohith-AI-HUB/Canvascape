# Canvascape v2 — The Spatial Operating System for the Web

> *Don't just browse the web. Inhabit it.*

---

## The Thesis

The browser was designed in 1993. Tabs were added in 2001. Nothing has fundamentally changed since.

**Canvascape replaces the tab strip with an infinite spatial canvas.** Every website, every note, every AI conversation, every code snippet — they all live as physical objects you can see, arrange, group, and connect. Your browser becomes a workspace you can *walk around in*.

Version 2 represents a paradigm shift: from "a better browser" to **a spatial operating system for knowledge work**.

---

## Core Architecture: The Unified Canvas

### One Canvas, Many Worlds

All workspaces coexist on a single infinite 2D plane. Each workspace has a **spatial origin** — a home coordinate thousands of pixels apart — creating isolated neighborhoods of activity that are still physically connected.

```
               ┌─────────────┐
               │  🔬 Research │
               │  (8000, 3000)│
               └─────────────┘

  ┌───────────────┐                    ← zoom out and you see everything
  │  💼 Work      │
  │  (0, 0)       │
  └───────────────┘
                          ┌──────────────┐
                          │  🏠 Personal  │
                          │  (-6000, 7000)│
                          └──────────────┘
```

- **Neighbor Activation**: Nodes within 2,000 canvas units of the viewport are fully active. Nodes between 2,000–3,000 units fade. Everything beyond is dormant — saving resources while preserving spatial permanence.
- **Workspace Zones**: Each workspace renders a subtle boundary ring around its origin, giving you a sense of "place" when navigating the canvas.
- **Fly-To Navigation**: Switching workspaces smoothly animates the camera to that workspace's origin and saved viewport. It feels like *traveling*, not switching.

### Why This Matters

Spatial memory is one of the strongest forms of human recall. When you place your research tabs to the *left* and your documentation to the *right*, your brain remembers the layout even days later. Tabs can't do this. Canvascape makes every browsing session a memory palace.

---

## The Five Pillars

### 1. 🌐 Spatial Browsing

Websites are rendered as live, interactive **Web Cards** — full browser windows on the canvas powered by Electron webviews.

| Capability | Detail |
|---|---|
| Live web rendering | Electron `<webview>` with full navigation, devtools, and site isolation |
| Card resize & z-order | Drag-to-resize with `NodeResizer`; click-to-focus z-ordering |
| Traffic-light controls | Close, minimize-to-tile, reload — per card |
| Minimized tiles | Compact 160×200 tiles showing favicon + title; restore on click |
| Tab stacks | Multiple URLs stacked inside a single card — switch, add, close tabs |
| Pin / unpin | Pinned cards survive workspace switches and history clears |
| Per-card notes | Flip open a note panel on any web card for annotations |
| Address bar editing | Click-to-edit URL in the header with live navigation |

### 2. 🤖 AI-Native Workspace

AI isn't a sidebar afterthought — it's a first-class citizen on the canvas.

- **AI Side Panel**: A persistent, full-height panel with multi-conversation management, workspace-aware context injection, markdown rendering with syntax highlighting, and streaming responses.
- **AI Canvas Cards**: Drop an AI chat directly onto the canvas, positioned right next to the websites it's analyzing. Each AI card maintains its own conversation thread.
- **Multi-Provider Support**: OpenAI (GPT-4o), Anthropic (Claude), Google Gemini, and local Ollama models — switchable per conversation.
- **Context-Aware**: Toggle on "workspace context" and the AI automatically sees the titles and URLs of every open tab in your current workspace.

### 3. 🧪 Live IDE Cards

Create HTML/CSS/JS directly on the canvas with instant live preview. AI-generated apps appear as IDE cards — your canvas becomes a development environment.

- Full code editor right on the canvas
- Instant preview rendering via iframe sandbox
- AI can generate and inject code directly into IDE cards
- Perfect for prototyping alongside reference material

### 4. 📐 Spatial Organization

Beyond just placing cards, Canvascape gives you tools to *structure* your spatial workspace:

- **Group Frames**: Colored rectangular regions with editable titles — drag multiple cards inside to visually cluster them. Color-cycling for differentiation.
- **Edges / Connections**: Link cards together to show relationships (powered by React Flow's edge system).
- **Workspace Separation**: Each workspace gets its own origin, color identity (palette-assigned), and emoji — making them visually distinct even when zoomed out.
- **Time Filters**: See only today's cards, this week's, or all — old cards dim or hide based on the filter.

### 5. ⌨️ Speed & Command

Power users never leave the keyboard:

| Shortcut | Action |
|---|---|
| `Ctrl+K` | Command Palette — fuzzy search nodes, run actions, switch workspaces |
| `Ctrl+N` | Open Composer — quick-launch a URL or create a new card |
| `Ctrl+\` | Toggle Sidebar |
| Canvas right-click | Context menu: new web card, new group, new IDE card, AI card, settings |

The **Command Palette** is the universal entry point — search by node title, URL, workspace name, or action keyword. It's the `Ctrl+K` that a browser should have always had.

---

## Persistence & State

**Everything is sticky.** There is no "save" button.

- Node positions, sizes, z-order, and minimized state
- Viewport position and zoom — per workspace
- AI conversations, provider settings, and context toggles
- Sidebar, panel, and theme state
- Tab stacks and per-card notes
- Session history with restore — closed tabs are recoverable

State is serialized to a local `workspace.json` via Electron IPC, debounced at 1.2 seconds. Workspace format is versioned (`v6`) with automatic migration from older schemas.

---

## UI & Design Language

### Aesthetic Principles

- **Warm Minimalism**: Dark mode with warm black neutrals; light mode with warm off-whites. Amber accent system throughout.
- **Glassmorphism**: Panels, modals, and context menus use `backdrop-filter: blur` with translucent surfaces.
- **Fluid Motion**: Framer Motion powers workspace transitions, panel slides, modal animations, and loading sequences.
- **Content-First**: Chrome is minimal. Your canvas content is always the hero.

### Design Tokens

```
Surfaces    →  --bg, --canvas, --s1..s4, --glass
Borders     →  --bd, --bd-h, --bd-a
Text        →  --t1..t4
Accent      →  --a, --a2, --a-dim, --a-bg, --a-bg2, --a-glow
Effects     →  --dot, --sh-card, --sh-active, --sh-panel, --sh-pill
```

Themes toggle via `data-theme` on `<html>`, with all components consuming CSS custom properties.

### Typography

**DM Sans** as the primary typeface — clean, geometric, modern — with system-ui fallback.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop Shell | Electron 29 (single-instance, webview-enabled) |
| Frontend | React 18 |
| Canvas Engine | React Flow 11 |
| State Management | Zustand (single store, debounced persistence) |
| Animation | Framer Motion |
| Styling | CSS Custom Properties + Tailwind utilities |
| AI Streaming | Fetch-based SSE streaming (OpenAI, Anthropic, Gemini, Ollama) |
| Bundler | Vite 5 |
| Package Manager | npm |

---

## Competitive Position

Canvascape's primary competitive reference is **Nimo** (macOS-only, invite-only, credit-based AI spatial browser).

### Where We Win

| Advantage | Impact |
|---|---|
| **Windows-first** | Entire Windows spatial-browser market uncontested |
| **Open access** | No invite gates, no waitlists |
| **Free** | No credit-based subscription friction |
| **Unified canvas** | All workspaces on one plane — true spatial continuity |
| **Time filters** | Unique temporal dimension for card visibility |
| **Local AI** | Ollama support = fully offline AI capability |

### Where We're Closing the Gap

| Feature | Status |
|---|---|
| AI side panel | ✅ Shipped |
| AI canvas cards | ✅ Shipped |
| Multi-provider AI | ✅ Shipped (4 providers) |
| Command palette | ✅ Shipped |
| Session history & restore | ✅ Shipped |
| Tab stacks | ✅ Shipped |
| Card notes/annotations | ✅ Shipped |
| Settings node | ✅ Shipped |

### Remaining Gaps

| Feature | Priority | Effort |
|---|---|---|
| App integrations (Gmail, Notion, Slack) | P1 | Very High |
| MCP server support | P2 | Very High |
| Dynamic AI app builder | P2 | High |
| Sharing / collaboration | P3 | Very High |

---

## Roadmap — What's Next

### Near-Term (v2.1)
- [ ] Mount `FloatingSearchBar` for in-page search
- [ ] Full theme tokenization of all components (CanvasContextMenu, etc.)
- [ ] Keyboard shortcut customization via Settings
- [ ] Workspace reordering and emoji picker

### Mid-Term (v2.5)
- [ ] App integration framework (start with OAuth-based Gmail / Notion)
- [ ] MCP server protocol support for third-party tool execution
- [ ] AI vision — let the AI "see" screenshots of your open cards
- [ ] Collaborative workspaces via WebSocket or CRDT sync
- [ ] Canvas search — full-text search across all card content

### Long-Term (v3.0)
- [ ] Plugin system for community-built node types
- [ ] Mobile companion viewer
- [ ] Cloud sync with E2E encryption
- [ ] Autonomous AI agents that can open, arrange, and interact with web cards

---

## Philosophy

Canvascape isn't trying to be a better Chrome. It's trying to be what comes **after** Chrome.

The browser was built for documents. We live in a world of **applications, conversations, and workflows**. Canvascape treats the web as a spatial medium — something you arrange, annotate, connect, and navigate — not a stack of hidden rectangles.

Every feature serves one question: **Does this make the canvas feel more like a place you work *in*, rather than a tool you work *with*?**

---

*Canvascape v2 — March 2026*
