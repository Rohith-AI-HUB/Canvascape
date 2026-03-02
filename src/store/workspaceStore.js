import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges } from 'reactflow'
import { debounce } from '../utils/debounce'

let _zCounter = 100
const nextZ = () => ++_zCounter

const DEFAULT_CATEGORIES = [
  { id: 'cat_work',     label: 'Work',     color: '#A78BFA', bg: 'rgba(167,139,250,0.08)' },
  { id: 'cat_research', label: 'Research', color: '#60A5FA', bg: 'rgba(96,165,250,0.08)'  },
  { id: 'cat_personal', label: 'Personal', color: '#34D399', bg: 'rgba(52,211,153,0.08)'  },
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
      theme: state.theme,
      version: 2,
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
  filter:          'all',
  isSidebarOpen:   true,
  isComposerOpen:  false,
  theme:           'dark',   // 'dark' | 'light'

  // ── ReactFlow wiring ────────────────────────────────────────────────────────
  onNodesChange: (changes) => {
    set((s) => {
      const updated = applyNodeChanges(changes, s.nodes)
      // Re-apply our zIndex after ReactFlow processes changes (it can strip it)
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
  addWebNode: ({ url, title, favicon, position, categoryId } = {}) => {
    const id = `web_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
    const pos = position ?? { x: 200 + Math.random() * 280, y: 100 + Math.random() * 200 }
    const z = nextZ()
    const node = {
      id,
      type: 'webNode',
      position: pos,
      data: {
        url:        url     ?? 'https://www.google.com',
        title:      title   ?? 'New Tab',
        favicon:    favicon ?? null,
        isLoading:  true,
        categoryId: categoryId ?? null,
        pinned:     false,
        minimized:  false,
        createdAt:  Date.now(),
      },
      style:      { width: 680, height: 480, zIndex: z },
      zIndex:     z,
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
    set((s) => ({ nodes: s.nodes.map((n) => n.id === id ? { ...n, style: { ...n.style, width: Math.max(320, w), height: Math.max(240, h) } } : n) }))
    _save(get())
  },
  removeNode: (id) => {
    set((s) => ({ nodes: s.nodes.filter((n) => n.id !== id), activeNodeId: s.activeNodeId === id ? null : s.activeNodeId }))
    _save(get())
  },
  duplicateNode: (id) => {
    const src = get().nodes.find((n) => n.id === id)
    if (!src) return
    const dup = { ...src, id: `web_${Date.now()}`, position: { x: src.position.x + 40, y: src.position.y + 40 }, zIndex: nextZ(), data: { ...src.data, createdAt: Date.now(), pinned: false, minimized: false } }
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
            width:  willMinimize ? 160 : (n.data._fullWidth  ?? 680),
            height: willMinimize ? 200 : (n.data._fullHeight ?? 480),
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

  // ── Categories ──────────────────────────────────────────────────────────────
  addCategory: (label) => {
    const idx = get().categories.length % PALETTE.length
    const id  = `cat_${Date.now()}`
    set((s) => ({ categories: [...s.categories, { id, label, ...PALETTE[idx] }] }))
    _save(get())
    return id
  },
  renameCategory: (id, label) => {
    set((s) => ({ categories: s.categories.map((c) => c.id === id ? { ...c, label } : c) }))
    _save(get())
  },
  removeCategory: (id) => {
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
      nodes: s.nodes.map((n) => n.data?.categoryId === id ? { ...n, data: { ...n.data, categoryId: null } } : n),
    }))
    _save(get())
  },

  // ── UI state ────────────────────────────────────────────────────────────────
  setFilter:       (f)   => set({ filter: f }),
  toggleSidebar:   ()    => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setComposerOpen: (val) => set({ isComposerOpen: val }),
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
          nodes:      saved.nodes,
          edges:      saved.edges ?? [],
          viewport:   saved.viewport ?? { x: 0, y: 0, zoom: 1 },
          categories: saved.categories ?? DEFAULT_CATEGORIES,
          theme,
        })
      }
    } catch (e) { console.error('Load failed', e) }
    finally    { set({ isLoading: false }) }
  },
}))
