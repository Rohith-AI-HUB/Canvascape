import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges } from 'reactflow'
import { debounce } from '../utils/debounce'

let _zCounter = 100
const nextZ = () => ++_zCounter

const DEFAULT_CATEGORIES = [
  { id: 'cat_work',     label: 'Work',     color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', emoji: '💼' },
  { id: 'cat_research', label: 'Research', color: '#60A5FA', bg: 'rgba(96,165,250,0.08)', emoji: '🔬' },
  { id: 'cat_personal', label: 'Personal', color: '#34D399', bg: 'rgba(52,211,153,0.08)', emoji: '🏠' },
]

const PALETTE = [
  { color: '#A78BFA', bg: 'rgba(167,139,250,0.08)' },
  { color: '#60A5FA', bg: 'rgba(96,165,250,0.08)'  },
  { color: '#34D399', bg: 'rgba(52,211,153,0.08)'  },
  { color: '#F97316', bg: 'rgba(249,115,22,0.08)'  },
  { color: '#F472B6', bg: 'rgba(244,114,182,0.08)' },
  { color: '#FBBF24', bg: 'rgba(251,191,36,0.08)'  },
]

const _save = debounce(async (state) => {
  try {
    await window.canvascape?.workspace.save({
      nodes: state.nodes,
      edges: state.edges,
      viewport: state.viewport,
      categories: state.categories,
      activeCategoryId: state.activeCategoryId,
      theme: state.theme,
      sessionHistory:   state.sessionHistory,
      aiProvider:       state.aiProvider,
      aiConversations:  state.aiConversations,
      version: 3,
      savedAt: Date.now(),
    })
  } catch (e) { console.warn('Save failed', e) }
}, 1200)

export const useWorkspaceStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  nodes:        [],
  edges:        [],
  viewport:     { x: 0, y: 0, zoom: 1 },
  activeNodeId: null,
  isLoading:    true,

  categories:      DEFAULT_CATEGORIES,
  activeCategoryId: 'cat_work', // Default to first category
  filter:          'all',
  isSidebarOpen:   true,
  isComposerOpen:  false,
  isCommandOpen:   false,
  isAIPanelOpen:   false,
  theme:           'dark',

  setActiveCategoryId: (id) => set({ activeCategoryId: id }),

  // ── AI state ────────────────────────────────────────────────────────────────
  aiConversations: [],  // [{ id, title, messages:[{id,role,content,ts}], createdAt, updatedAt }]
  aiCurrentId:     null,
  aiContextEnabled: true,
  aiProvider: {
    active:    'openai',
    openai:    { apiKey: '', model: 'gpt-4o' },
    anthropic: { apiKey: '', model: 'claude-opus-4-5' },
    gemini:    { apiKey: '', model: 'gemini-2.0-flash' },
    ollama:    { baseUrl: 'http://localhost:11434', model: 'llama3.2' },
  },

  setAIProvider:   (patch) => { set((s) => ({ aiProvider: { ...s.aiProvider, ...patch } })); _save(get()) },
  setAIContextEnabled: (val) => set({ aiContextEnabled: val }),

  aiNewChat: () => {
    const id = `conv_${Date.now()}`
    set((s) => ({ aiConversations: [{ id, title: 'New chat', messages: [], createdAt: Date.now(), updatedAt: Date.now() }, ...s.aiConversations], aiCurrentId: id }))
  },
  aiSelectConv: (id) => set({ aiCurrentId: id }),
  aiDeleteConv: (id) => set((s) => ({
    aiConversations: s.aiConversations.filter(c => c.id !== id),
    aiCurrentId: s.aiCurrentId === id ? (s.aiConversations.find(c => c.id !== id)?.id ?? null) : s.aiCurrentId,
  })),
  aiCurrentMessages: () => {
    const s = get()
    return s.aiConversations.find(c => c.id === s.aiCurrentId)?.messages ?? []
  },
  aiPushMessage: (msg) => {
    set((s) => ({
      aiConversations: s.aiConversations.map(c => {
        if (c.id !== s.aiCurrentId) return c
        const msgs = [...c.messages, msg]
        const title = c.title === 'New chat' && msg.role === 'user'
          ? msg.content.slice(0, 52) + (msg.content.length > 52 ? '…' : '') : c.title
        return { ...c, messages: msgs, title, updatedAt: Date.now() }
      })
    }))
    _save(get())
  },
  aiUpdateLastMessage: (content) => {
    set((s) => ({
      aiConversations: s.aiConversations.map(c => {
        if (c.id !== s.aiCurrentId || !c.messages.length) return c
        const msgs = [...c.messages]
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content }
        return { ...c, messages: msgs, updatedAt: Date.now() }
      })
    }))
  },
  aiClearCurrent: () => {
    set((s) => ({
      aiConversations: s.aiConversations.map(c =>
        c.id === s.aiCurrentId ? { ...c, messages: [], title: 'New chat', updatedAt: Date.now() } : c
      )
    }))
    _save(get())
  },

  // Session history — tracks closed web nodes for restore
  sessionHistory: [], // [{ id, url, title, favicon, note, closedAt }]

  // ── ReactFlow wiring ────────────────────────────────────────────────────────
  onNodesChange: (changes) => {
    set((s) => {
      const updated = applyNodeChanges(changes, s.nodes)
      const zMap = Object.fromEntries(s.nodes.map(n => [n.id, n.zIndex]))
      return { nodes: updated.map(n => zMap[n.id] != null ? { ...n, zIndex: zMap[n.id] } : n) }
    })
    _save(get())
  },
  onEdgesChange: (changes) => {
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) }))
  },
  setViewport: (vp) => { set({ viewport: vp }); _save(get()) },

  // ── Node focus / z-order ────────────────────────────────────────────────────
  setActiveNode: (id) => {
    if (!id) { set({ activeNodeId: null }); return }
    const z = nextZ()
    set((s) => ({
      activeNodeId: id,
      nodes: s.nodes.map((n) => n.id === id ? { ...n, zIndex: z } : n),
    }))
  },

  // ── Add web node ────────────────────────────────────────────────────────────
  addWebNode: ({ url, title, favicon, position, categoryId, pinned } = {}) => {
    const s = get()
    const id = `web_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
    const pos = position ?? { x: 200 + Math.random() * 280, y: 100 + Math.random() * 200 }
    const z = nextZ()
    const node = {
      id,
      type: 'webNode',
      position: pos,
      data: {
        url:          url     ?? 'https://www.google.com',
        title:        title   ?? 'New Tab',
        favicon:      favicon ?? null,
        isLoading:    true,
        categoryId:   categoryId ?? s.activeCategoryId,
        pinned:       pinned  ?? false,
        minimized:    false,
        createdAt:    Date.now(),
        note:         '',
        isNoteOpen:   false,
        // Tab stack — each entry: { url, title, favicon }
        tabs:         [{ url: url ?? 'https://www.google.com', title: title ?? 'New Tab', favicon: favicon ?? null }],
        activeTabIdx: 0,
      },
      style:      { width: 1280, height: 800, zIndex: z },
      zIndex:     z,
      dragHandle: '.node-drag-handle',
    }
    set((s) => ({ nodes: [...s.nodes, node], activeNodeId: id }))
    _save(get())
    return id
  },

  // ── Add IDE node (code + live preview) ──────────────────────────────────────
  addIdeNode: ({ title, html, position, categoryId } = {}) => {
    const s = get()
    const id = `ide_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const pos = position ?? { x: 160 + Math.random() * 280, y: 90 + Math.random() * 180 }
    const z = nextZ()
    const node = {
      id,
      type: 'ideNode',
      position: pos,
      data: {
        title: title ?? 'Live IDE Preview',
        code: html ?? '<!doctype html>\n<html>\n  <head><meta charset="utf-8" /><title>Live IDE</title></head>\n  <body><h1>Hello from Canvascape</h1></body>\n</html>',
        categoryId: categoryId ?? s.activeCategoryId,
        createdAt: Date.now(),
        aiGenerated: true,
      },
      style: { width: 1280, height: 800, zIndex: z },
      zIndex: z,
      dragHandle: '.node-drag-handle',
    }
    set((s) => ({ nodes: [...s.nodes, node], activeNodeId: id }))
    _save(get())
    return id
  },

  // ── Add AI canvas node ───────────────────────────────────────────────────────
  addAICanvasNode: ({ position } = {}) => {
    const id  = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const pos = position ?? { x: 200 + Math.random() * 200, y: 80 + Math.random() * 160 }
    const z   = nextZ()
    const node = {
      id,
      type:     'aiNode',
      position: pos,
      data:     { messages: [], createdAt: Date.now() },
      style:    { width: 360, height: 520, zIndex: z },
      zIndex:   z,
      dragHandle: '.node-drag-handle',
    }
    set((s) => ({ nodes: [...s.nodes, node], activeNodeId: id }))
    _save(get())
    return id
  },

  // ── Add Settings node ───────────────────────────────────────────────────────
  addSettingsNode: ({ position } = {}) => {
    const s = get()
    // Check if settings node already exists
    const existing = s.nodes.find(n => n.type === 'settingsNode')
    if (existing) {
      get().setActiveNode(existing.id)
      return existing.id
    }

    const id  = `settings_${Date.now()}`
    const pos = position ?? { x: 200 + Math.random() * 200, y: 80 + Math.random() * 160 }
    const z   = nextZ()
    const node = {
      id,
      type:     'settingsNode',
      position: pos,
      data:     { title: 'Settings', createdAt: Date.now() },
      style:    { width: 500, height: 600, zIndex: z },
      zIndex:   z,
      dragHandle: '.node-drag-handle',
    }
    set((s) => ({ nodes: [...s.nodes, node], activeNodeId: id }))
    _save(get())
    return id
  },

  // ── Add group frame ─────────────────────────────────────────────────────────
  addGroupNode: ({ position, categoryId } = {}) => {
    const cats = get().categories
    const cat  = cats.find((c) => c.id === categoryId) ?? cats[0]
    const id   = `group_${Date.now()}`
    const node = {
      id,
      type:     'groupFrame',
      position: position ?? { x: 60, y: 60 },
      data:     { label: cat?.label ?? 'Group', color: cat?.color ?? '#A78BFA', bg: cat?.bg ?? 'rgba(167,139,250,0.08)', categoryId: cat?.id ?? null },
      style:    { width: 820, height: 560 },
      zIndex:   1,
      dragHandle: '.group-drag-handle',
    }
    set((s) => ({ nodes: [node, ...s.nodes] }))
    _save(get())
    return id
  },

  // ── Mutations ───────────────────────────────────────────────────────────────
  updateNodeData: (id, patch) => {
    set((s) => ({ nodes: s.nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n) }))
    _save(get())
  },
  resizeNode: (id, w, h) => {
    set((s) => ({ nodes: s.nodes.map((n) => n.id === id ? { ...n, style: { ...n.style, width: Math.max(1280, w), height: Math.max(800, h) } } : n) }))
    _save(get())
  },

  // removeNode — pushes to session history if it's a web node
  removeNode: (id) => {
    const node = get().nodes.find((n) => n.id === id)
    if (node?.type === 'webNode') {
      const histEntry = {
        id:       `hist_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
        url:      node.data.url,
        title:    node.data.title,
        favicon:  node.data.favicon,
        note:     node.data.note || '',
        closedAt: Date.now(),
        pinned:   node.data.pinned || false,
      }
      set((s) => ({
        sessionHistory: [histEntry, ...s.sessionHistory].slice(0, 40),
        nodes:          s.nodes.filter((n) => n.id !== id),
        activeNodeId:   s.activeNodeId === id ? null : s.activeNodeId,
      }))
    } else {
      set((s) => ({
        nodes:        s.nodes.filter((n) => n.id !== id),
        activeNodeId: s.activeNodeId === id ? null : s.activeNodeId,
      }))
    }
    _save(get())
  },

  duplicateNode: (id) => {
    const src = get().nodes.find((n) => n.id === id)
    if (!src) return
    const dup = {
      ...src,
      id:       `web_${Date.now()}`,
      position: { x: src.position.x + 40, y: src.position.y + 40 },
      zIndex:   nextZ(),
      data:     { ...src.data, createdAt: Date.now(), pinned: false, minimized: false, note: '', isNoteOpen: false },
    }
    set((s) => ({ nodes: [...s.nodes, dup] }))
    _save(get())
  },

  togglePin: (id) => {
    set((s) => ({ nodes: s.nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, pinned: !n.data.pinned } } : n) }))
    _save(get())
  },

  toggleMinimize: (id) => {
    const z = nextZ()
    set((s) => ({
      activeNodeId: id,
      nodes: s.nodes.map((n) => {
        if (n.id !== id) return n
        const willMinimize = !n.data.minimized
        return {
          ...n,
          zIndex: z,
          data: {
            ...n.data,
            minimized:   willMinimize,
            _fullWidth:  willMinimize ? (n.style?.width  ?? 680) : n.data._fullWidth,
            _fullHeight: willMinimize ? (n.style?.height ?? 480) : n.data._fullHeight,
          },
          style: {
            ...n.style,
            zIndex: z,
            width:  willMinimize ? 160 : Math.max(n.data._fullWidth  ?? 1280, 1280),
            height: willMinimize ? 200 : Math.max(n.data._fullHeight ?? 800,  800),
          },
        }
      }),
    }))
    _save(get())
  },

  assignCategory: (nodeId, categoryId) => {
    set((s) => ({ nodes: s.nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, categoryId } } : n) }))
    _save(get())
  },

  // ── Notes ───────────────────────────────────────────────────────────────────
  toggleNotePanel: (id) => {
    set((s) => ({
      nodes: s.nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, isNoteOpen: !n.data.isNoteOpen } } : n)
    }))
  },
  updateNote: (id, note) => {
    set((s) => ({ nodes: s.nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, note } } : n) }))
    _save(get())
  },

  // ── Tab stacks ──────────────────────────────────────────────────────────────
  addTab: (nodeId, url, title, favicon) => {
    const node = get().nodes.find((n) => n.id === nodeId)
    if (!node) return
    const existingTabs = node.data.tabs?.length
      ? node.data.tabs
      : [{ url: node.data.url, title: node.data.title, favicon: node.data.favicon }]
    const newTab   = { url, title: title || url, favicon: favicon || null }
    const newTabs  = [...existingTabs, newTab]
    const newIdx   = newTabs.length - 1
    set((s) => ({
      nodes: s.nodes.map((n) => n.id === nodeId
        ? { ...n, data: { ...n.data, tabs: newTabs, activeTabIdx: newIdx, url, title: newTab.title, favicon: newTab.favicon, isLoading: true } }
        : n)
    }))
    _save(get())
  },

  switchTab: (nodeId, tabIdx) => {
    const node = get().nodes.find((n) => n.id === nodeId)
    if (!node) return
    // Save current URL into current tab slot before switching
    const tabs = node.data.tabs?.length
      ? [...node.data.tabs]
      : [{ url: node.data.url, title: node.data.title, favicon: node.data.favicon }]
    const curIdx = node.data.activeTabIdx ?? 0
    tabs[curIdx] = { ...tabs[curIdx], url: node.data.url, title: node.data.title, favicon: node.data.favicon }
    const target = tabs[tabIdx]
    if (!target) return
    set((s) => ({
      nodes: s.nodes.map((n) => n.id === nodeId
        ? { ...n, data: { ...n.data, tabs, activeTabIdx: tabIdx, url: target.url, title: target.title, favicon: target.favicon, isLoading: true } }
        : n)
    }))
    _save(get())
  },

  closeTab: (nodeId, tabIdx) => {
    const node = get().nodes.find((n) => n.id === nodeId)
    if (!node) return
    const tabs = node.data.tabs?.length
      ? node.data.tabs
      : [{ url: node.data.url, title: node.data.title, favicon: node.data.favicon }]
    if (tabs.length <= 1) { get().removeNode(nodeId); return }
    const newTabs  = tabs.filter((_, i) => i !== tabIdx)
    const newActive = Math.min(tabIdx, newTabs.length - 1)
    const target   = newTabs[newActive]
    set((s) => ({
      nodes: s.nodes.map((n) => n.id === nodeId
        ? { ...n, data: { ...n.data, tabs: newTabs, activeTabIdx: newActive, url: target.url, title: target.title, favicon: target.favicon, isLoading: true } }
        : n)
    }))
    _save(get())
  },

  // ── Session history ─────────────────────────────────────────────────────────
  clearHistory: () => { set({ sessionHistory: [] }); _save(get()) },
  restoreFromHistory: (histEntry) => {
    get().addWebNode({ url: histEntry.url, title: histEntry.title, favicon: histEntry.favicon, pinned: histEntry.pinned })
    // Remove from history after restore
    set((s) => ({ sessionHistory: s.sessionHistory.filter((h) => h.id !== histEntry.id) }))
    _save(get())
  },

  // ── Categories ──────────────────────────────────────────────────────────────
  addCategory: (label) => {
    const idx = get().categories.length % PALETTE.length
    const id  = `cat_${Date.now()}`
    set((s) => ({
      categories: [...s.categories, { id, label, ...PALETTE[idx] }],
      activeCategoryId: id,
    }))
    _save(get())
    return id
  },
  renameCategory: (id, label) => {
    set((s) => ({ categories: s.categories.map((c) => c.id === id ? { ...c, label } : c) }))
    _save(get())
  },
  updateCategory: (id, patch) => {
    set((s) => ({
      categories: s.categories.map((c) => c.id === id ? { ...c, ...patch } : c),
      nodes: s.nodes.map((n) => n.data?.categoryId === id ? { ...n, data: { ...n.data, color: patch.color ?? n.data.color, bg: patch.bg ?? n.data.bg } } : n)
    }))
    _save(get())
  },
  removeCategory: (id) => {
    set((s) => {
      const nextCats = s.categories.filter((c) => c.id !== id)
      return {
        categories: nextCats,
        activeCategoryId: s.activeCategoryId === id ? (nextCats[0]?.id ?? null) : s.activeCategoryId,
        nodes: s.nodes.map((n) => n.data?.categoryId === id ? { ...n, data: { ...n.data, categoryId: null } } : n),
      }
    })
    _save(get())
  },

  // ── UI state ────────────────────────────────────────────────────────────────
  setFilter:        (f)   => set({ filter: f }),
  toggleSidebar:    ()    => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setComposerOpen:  (val) => set({ isComposerOpen: val }),
  setCommandOpen:   (val) => set({ isCommandOpen: val }),
  toggleAIPanel:    ()    => set((s) => ({ isAIPanelOpen: !s.isAIPanelOpen })),
  setAIPanelOpen:   (val) => set({ isAIPanelOpen: val }),
  toggleTheme:     ()    => {
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      return { theme: next }
    })
    _save(get())
  },

  // ── Persistence ─────────────────────────────────────────────────────────────
  loadWorkspace: async () => {
    if (!window.canvascape) { set({ isLoading: false }); return }
    try {
      const saved = await window.canvascape.workspace.load()
      if (saved?.nodes?.length) {
        _zCounter = saved.nodes.reduce((m, n) => Math.max(m, n.zIndex ?? 0), 100)
        const theme = saved.theme ?? 'dark'
        document.documentElement.setAttribute('data-theme', theme)
        set({
          nodes:          saved.nodes,
          edges:          saved.edges ?? [],
          viewport:       saved.viewport ?? { x: 0, y: 0, zoom: 1 },
          categories:     saved.categories ?? DEFAULT_CATEGORIES,
          activeCategoryId: saved.activeCategoryId ?? (saved.categories?.[0]?.id ?? 'cat_work'),
          sessionHistory: saved.sessionHistory ?? [],
          aiProvider:       saved.aiProvider       ?? get().aiProvider,
          aiConversations:  saved.aiConversations  ?? [],
          aiCurrentId:      saved.aiConversations?.[0]?.id ?? null,
          theme,
        })
      }
    } catch (e) { console.error('Load failed', e) }
    finally    { set({ isLoading: false }) }
  },
}))
