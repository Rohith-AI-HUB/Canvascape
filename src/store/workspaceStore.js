import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges } from 'reactflow'
import { debounce } from '../utils/debounce'

let _zCounter = 100
const nextZ = () => ++_zCounter

// ── Unified Canvas constants ──────────────────────────────────────────────────
export const ACTIVATION_RADIUS = 2000  // canvas units — nodes within this are fully active
export const FADE_RADIUS = 3000  // canvas units — nodes between ACTIVATION and FADE are transitioning

const GRID_GAP_X = 180
const GRID_GAP_Y = 140
const GROUP_GAP_X = 280
const GROUP_GAP_Y = 220
const GROUP_HEADER_SPACE = 28
const GROUP_TIMEOUT_MS = 18_000

const DEFAULT_WORKSPACES = [
  { id: 'ws_work', label: 'Work', color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', emoji: '💼', sessionHistory: [], viewport: { x: 0, y: 0, zoom: 1 } },
  { id: 'ws_research', label: 'Research', color: '#60A5FA', bg: 'rgba(96,165,250,0.08)', emoji: '🔬', sessionHistory: [], viewport: { x: 0, y: 0, zoom: 1 } },
  { id: 'ws_personal', label: 'Personal', color: '#34D399', bg: 'rgba(52,211,153,0.08)', emoji: '🏠', sessionHistory: [], viewport: { x: 0, y: 0, zoom: 1 } },
]

function nodesInWorkspace(nodes, workspaceId) {
  return nodes.filter((n) => n.data?.workspaceId === workspaceId)
}

function clusterCenter(nodes, fallback) {
  if (!nodes.length) return fallback
  const total = nodes.reduce((acc, n) => {
    acc.x += n.position?.x ?? 0
    acc.y += n.position?.y ?? 0
    return acc
  }, { x: 0, y: 0 })
  return { x: total.x / nodes.length, y: total.y / nodes.length }
}

function viewportToCanvasCenter(vp) {
  if (
    !vp ||
    !Number.isFinite(vp.x) ||
    !Number.isFinite(vp.y) ||
    !Number.isFinite(vp.zoom) ||
    vp.zoom <= 0
  ) return null

  const width = typeof window !== 'undefined' ? window.innerWidth : 1920
  const height = typeof window !== 'undefined' ? window.innerHeight : 1080
  return {
    x: -vp.x + (width / 2) / vp.zoom,
    y: -vp.y + (height / 2) / vp.zoom,
  }
}

function clusterSpawnPosition(state, workspaceId) {
  const wsNodes = nodesInWorkspace(state.nodes, workspaceId)
  const ws = state.workspaces.find((w) => w.id === workspaceId)
  const seedCenter = viewportToCanvasCenter(ws?.viewport) ?? state.viewportCenter ?? { x: 0, y: 0 }
  const center = clusterCenter(wsNodes, seedCenter)

  // Spread new nodes around each workspace cluster.
  const angle = Math.random() * Math.PI * 2
  const baseRadius = Math.min(620, 180 + wsNodes.length * 28)
  const radius = baseRadius + Math.random() * 90
  const jitter = 50

  return {
    x: center.x + Math.cos(angle) * radius + (Math.random() - 0.5) * jitter,
    y: center.y + Math.sin(angle) * radius + (Math.random() - 0.5) * jitter,
  }
}

function normalizeOllamaBaseUrl(rawUrl) {
  let url = String(rawUrl || '').trim()
  if (!url) url = 'http://localhost:11434'
  return url.replace(/\/+$/, '').replace(/\/(v1|api)$/i, '')
}

async function readErrorBody(res) {
  const text = await res.text().catch(() => '')
  if (!text) return ''
  try {
    const body = JSON.parse(text)
    return body.error?.message || body.error || text
  } catch {
    return text
  }
}

function extractJsonChunk(text) {
  const raw = String(text || '').trim()
  if (!raw) return ''
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start >= 0 && end > start) return raw.slice(start, end + 1)
  return raw
}

function parseGroupingPayload(rawText, validIds) {
  const jsonText = extractJsonChunk(rawText)
  if (!jsonText) return null

  let parsed
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return null
  }

  const groupsRaw = Array.isArray(parsed) ? parsed : parsed.groups
  if (!Array.isArray(groupsRaw)) return null

  const valid = new Set(validIds)
  const seen = new Set()
  const groups = []

  for (const group of groupsRaw) {
    const rawMembers = group?.tabs ?? group?.ids ?? group?.items ?? []
    if (!Array.isArray(rawMembers)) continue
    const tabIds = []

    for (const item of rawMembers) {
      const id = typeof item === 'string'
        ? item
        : (typeof item?.id === 'string' ? item.id : null)
      if (!id || !valid.has(id) || seen.has(id)) continue
      seen.add(id)
      tabIds.push(id)
    }

    if (!tabIds.length) continue
    const name = String(group?.name || group?.label || 'Group').trim() || 'Group'
    groups.push({ name: name.slice(0, 48), tabIds })
  }

  if (!groups.length) return null

  const unassigned = validIds.filter((id) => !seen.has(id))
  if (unassigned.length) groups.push({ name: 'Ungrouped', tabIds: unassigned })
  return groups
}

function rootDomain(rawUrl) {
  try {
    const host = new URL(rawUrl).hostname.replace(/^www\./i, '')
    const parts = host.split('.')
    if (parts.length <= 2) return host
    return parts.slice(-2).join('.')
  } catch {
    return ''
  }
}

function inferTopic(node) {
  const text = `${node?.data?.title || ''} ${node?.data?.url || ''}`.toLowerCase()
  if (/(github|gitlab|stack|docs|developer|api|npm|code|repo)/.test(text)) return 'Development'
  if (/(youtube|netflix|spotify|music|video|movie|anime|twitch)/.test(text)) return 'Media'
  if (/(news|blog|article|research|wikipedia|read|journal)/.test(text)) return 'Reading'
  if (/(amazon|flipkart|shop|store|cart|checkout|deal)/.test(text)) return 'Shopping'
  if (/(mail|calendar|notion|docs\.google|drive|slack|teams|jira|linear|asana)/.test(text)) return 'Work'
  if (/(chatgpt|claude|gemini|ollama|openai|anthropic)/.test(text)) return 'AI'
  return 'General'
}

function buildFallbackGroups(webNodes) {
  const byDomain = new Map()
  for (const node of webNodes) {
    const key = rootDomain(node.data?.url) || 'misc'
    const group = byDomain.get(key) || []
    group.push(node.id)
    byDomain.set(key, group)
  }

  if (byDomain.size <= Math.max(1, Math.ceil(webNodes.length * 0.75))) {
    return [...byDomain.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([key, tabIds]) => ({ name: key === 'misc' ? 'General' : key, tabIds }))
  }

  const byTopic = new Map()
  for (const node of webNodes) {
    const key = inferTopic(node)
    const group = byTopic.get(key) || []
    group.push(node.id)
    byTopic.set(key, group)
  }
  return [...byTopic.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([name, tabIds]) => ({ name, tabIds }))
}

function nodeSize(node) {
  return {
    w: Math.max(480, Number(node?.style?.width) || 1280),
    h: Math.max(320, Number(node?.style?.height) || 800),
  }
}

function sumUntil(values, endExclusive) {
  let total = 0
  for (let i = 0; i < endExclusive; i++) total += values[i] || 0
  return total
}

function buildGroupedPositions(groups, webNodes, center) {
  const nodesById = new Map(webNodes.map((n) => [n.id, n]))
  const blocks = []

  for (const group of groups) {
    const nodes = (group.tabIds || []).map((id) => nodesById.get(id)).filter(Boolean)
    if (!nodes.length) continue

    const cols = Math.max(1, Math.min(3, Math.ceil(Math.sqrt(nodes.length))))
    const rows = Math.ceil(nodes.length / cols)
    const colWidths = Array(cols).fill(0)
    const rowHeights = Array(rows).fill(0)

    nodes.forEach((node, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const { w, h } = nodeSize(node)
      colWidths[col] = Math.max(colWidths[col], w)
      rowHeights[row] = Math.max(rowHeights[row], h)
    })

    const width = colWidths.reduce((acc, value) => acc + value, 0) + GRID_GAP_X * (cols - 1)
    const height = rowHeights.reduce((acc, value) => acc + value, 0) + GRID_GAP_Y * (rows - 1) + GROUP_HEADER_SPACE
    blocks.push({ name: group.name, nodes, cols, rows, colWidths, rowHeights, width, height })
  }

  if (!blocks.length) return new Map()

  const blockCols = Math.max(1, Math.min(3, Math.ceil(Math.sqrt(blocks.length))))
  const blockRows = Math.ceil(blocks.length / blockCols)
  const layoutColWidths = Array(blockCols).fill(0)
  const layoutRowHeights = Array(blockRows).fill(0)

  blocks.forEach((block, idx) => {
    const col = idx % blockCols
    const row = Math.floor(idx / blockCols)
    layoutColWidths[col] = Math.max(layoutColWidths[col], block.width)
    layoutRowHeights[row] = Math.max(layoutRowHeights[row], block.height)
  })

  const totalWidth = layoutColWidths.reduce((acc, value) => acc + value, 0) + GROUP_GAP_X * (blockCols - 1)
  const totalHeight = layoutRowHeights.reduce((acc, value) => acc + value, 0) + GROUP_GAP_Y * (blockRows - 1)
  const originX = center.x - totalWidth / 2
  const originY = center.y - totalHeight / 2

  const positions = new Map()

  blocks.forEach((block, idx) => {
    const blockCol = idx % blockCols
    const blockRow = Math.floor(idx / blockCols)
    const cellX = originX + sumUntil(layoutColWidths, blockCol) + GROUP_GAP_X * blockCol
    const cellY = originY + sumUntil(layoutRowHeights, blockRow) + GROUP_GAP_Y * blockRow
    const blockX = cellX + (layoutColWidths[blockCol] - block.width) / 2
    const blockY = cellY + GROUP_HEADER_SPACE

    block.nodes.forEach((node, nodeIdx) => {
      const col = nodeIdx % block.cols
      const row = Math.floor(nodeIdx / block.cols)
      const { w, h } = nodeSize(node)
      const colStart = blockX + sumUntil(block.colWidths, col) + GRID_GAP_X * col
      const rowStart = blockY + sumUntil(block.rowHeights, row) + GRID_GAP_Y * row
      const x = colStart + (block.colWidths[col] - w) / 2
      const y = rowStart + (block.rowHeights[row] - h) / 2
      positions.set(node.id, { x, y, groupName: block.name })
    })
  })

  return positions
}

async function requestOllamaTabGroups(webNodes, workspaceLabel, ollamaCfg) {
  const baseUrl = normalizeOllamaBaseUrl(ollamaCfg?.baseUrl || 'http://localhost:11434')
  const model = ollamaCfg?.model || 'llama3.2'
  const tabs = webNodes.map((node) => ({
    id: node.id,
    title: node.data?.title || 'Untitled',
    url: node.data?.url || '',
    host: rootDomain(node.data?.url) || '',
  }))
  const ids = tabs.map((tab) => tab.id)

  const system = [
    'You are a tab-grouping engine.',
    'Return strict JSON only.',
    'Output schema:',
    '{"groups":[{"name":"Group name","tabs":["tab_id_1","tab_id_2"]}]}',
    'Rules:',
    '- Every tab id must appear exactly once.',
    '- No ids outside the provided list.',
    '- Use 2 to 7 groups depending on topical similarity.',
    '- Keep names short (1 to 3 words).',
  ].join('\n')

  const user = JSON.stringify({
    workspace: workspaceLabel || 'Workspace',
    tabs,
  })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), GROUP_TIMEOUT_MS)

  try {
    let res
    try {
      res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          stream: false,
          format: 'json',
          options: { temperature: 0.1 },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      })
    } catch (err) {
      if (err?.name === 'AbortError') throw new Error('Ollama request timed out.')
      throw new Error(`Cannot connect to Ollama at ${baseUrl}.`)
    }

    if (res.status === 404) {
      const v1 = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          response_format: { type: 'json_object' },
          temperature: 0.1,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      })
      if (!v1.ok) {
        const details = await readErrorBody(v1)
        throw new Error(details || `Ollama ${v1.status}: ${v1.statusText}`)
      }
      const body = await v1.json().catch(() => ({}))
      const rawContent = body?.choices?.[0]?.message?.content ?? ''
      const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent)
      const parsed = parseGroupingPayload(content, ids)
      if (!parsed) throw new Error('Ollama returned invalid grouping JSON.')
      return parsed
    }

    if (!res.ok) {
      const details = await readErrorBody(res)
      throw new Error(details || `Ollama ${res.status}: ${res.statusText}`)
    }

    const body = await res.json().catch(() => ({}))
    const rawContent = body?.message?.content ?? ''
    const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent)
    const parsed = parseGroupingPayload(content, ids)
    if (!parsed) throw new Error('Ollama returned invalid grouping JSON.')
    return parsed
  } finally {
    clearTimeout(timeout)
  }
}

const PALETTE = [
  { color: '#A78BFA', bg: 'rgba(167,139,250,0.08)' },
  { color: '#60A5FA', bg: 'rgba(96,165,250,0.08)' },
  { color: '#34D399', bg: 'rgba(52,211,153,0.08)' },
  { color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
  { color: '#F472B6', bg: 'rgba(244,114,182,0.08)' },
  { color: '#FBBF24', bg: 'rgba(251,191,36,0.08)' },
]

const _save = debounce(async (state) => {
  try {
    await window.canvascape?.workspace.save({
      nodes: state.nodes,
      edges: state.edges,
      workspaces: state.workspaces,
      activeWorkspaceId: state.activeWorkspaceId,
      theme: state.theme,
      aiProvider: state.aiProvider,
      aiConversations: state.aiConversations,
      aiCurrentId: state.aiCurrentId,
      isSidebarOpen: state.isSidebarOpen,
      isAIPanelOpen: state.isAIPanelOpen,
      filter: state.filter,
      aiContextEnabled: state.aiContextEnabled,
      version: 6,
      savedAt: Date.now(),
    })
  } catch (e) { console.warn('Save failed', e) }
}, 1200)

export const useWorkspaceStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  nodes: [],
  edges: [],
  activeNodeId: null,
  isLoading: true,
  viewportCenter: { x: 0, y: 0 },   // tracks current viewport center for neighbor algo

  workspaces: DEFAULT_WORKSPACES,
  activeWorkspaceId: 'ws_work',
  filter: 'all',
  isSidebarOpen: true,
  isComposerOpen: false,
  isCommandOpen: false,
  isAIPanelOpen: false,
  workspaceGroupingStatus: {},
  theme: 'dark',

  setActiveWorkspaceId: (id) => {
    set((s) => {
      // Save current viewport into the workspace before switching
      // Actually, we should probably update it on move end too, 
      // but let's ensure it's saved here if not already.
      return { activeWorkspaceId: id }
    })
    _save(get())
  },

  // Helper to get active workspace object
  getActiveWorkspace: () => {
    const s = get()
    return s.workspaces.find(w => w.id === s.activeWorkspaceId) || s.workspaces[0]
  },

  // ── AI state ────────────────────────────────────────────────────────────────
  aiConversations: [],  // [{ id, title, messages:[{id,role,content,ts}], createdAt, updatedAt }]
  aiCurrentId: null,
  aiContextEnabled: true,
  aiProvider: {
    active: 'openai',
    openai: { apiKey: '', model: 'gpt-4o' },
    anthropic: { apiKey: '', model: 'claude-opus-4-5' },
    gemini: { apiKey: '', model: 'gemini-2.0-flash' },
    ollama: { baseUrl: 'http://localhost:11434', model: 'llama3.2' },
  },

  setAIProvider: (patch) => { set((s) => ({ aiProvider: { ...s.aiProvider, ...patch } })); _save(get()) },
  setAIContextEnabled: (val) => { set({ aiContextEnabled: val }); _save(get()) },

  aiNewChat: () => {
    const id = `conv_${Date.now()}`
    set((s) => ({ aiConversations: [{ id, title: 'New chat', messages: [], createdAt: Date.now(), updatedAt: Date.now() }, ...s.aiConversations], aiCurrentId: id }))
    _save(get())
  },
  aiSelectConv: (id) => { set({ aiCurrentId: id }); _save(get()) },
  aiDeleteConv: (id) => {
    set((s) => ({
      aiConversations: s.aiConversations.filter(c => c.id !== id),
      aiCurrentId: s.aiCurrentId === id ? (s.aiConversations.find(c => c.id !== id)?.id ?? null) : s.aiCurrentId,
    }))
    _save(get())
  },
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
  setViewport: (vp) => {
    set((s) => ({
      viewportCenter: { x: -vp.x + (window.innerWidth / 2) / vp.zoom, y: -vp.y + (window.innerHeight / 2) / vp.zoom },
      workspaces: s.workspaces.map(w =>
        w.id === s.activeWorkspaceId ? { ...w, viewport: vp } : w
      )
    }))
    _save(get())
  },

  // ── Node focus / z-order ────────────────────────────────────────────────────
  setActiveNode: (id) => {
    if (!id) { set({ activeNodeId: null }); return }
    const z = nextZ()
    set((s) => ({
      activeNodeId: id,
      nodes: s.nodes.map((n) => n.id === id ? { ...n, zIndex: z } : n),
    }))
    _save(get())
  },

  // ── Add web node ────────────────────────────────────────────────────────────
  addWebNode: ({ url, title, favicon, position, workspaceId, pinned } = {}) => {
    const s = get()
    const wsId = workspaceId ?? s.activeWorkspaceId
    const id = `web_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const pos = position ?? clusterSpawnPosition(s, wsId)
    const z = nextZ()
    const node = {
      id,
      type: 'webNode',
      position: pos,
      data: {
        url: url ?? 'https://www.google.com',
        title: title ?? 'New Tab',
        favicon: favicon ?? null,
        isLoading: true,
        workspaceId: wsId,
        pinned: pinned ?? false,
        minimized: false,
        createdAt: Date.now(),
        note: '',
        isNoteOpen: false,
        // Tab stack — each entry: { url, title, favicon }
        tabs: [{ url: url ?? 'https://www.google.com', title: title ?? 'New Tab', favicon: favicon ?? null }],
        activeTabIdx: 0,
      },
      style: { width: 1280, height: 800, zIndex: z },
      zIndex: z,
      dragHandle: '.node-drag-handle',
    }
    set((s) => ({ nodes: [...s.nodes, node], activeNodeId: id }))
    _save(get())
    return id
  },

  // ── Add IDE node (code + live preview) ──────────────────────────────────────
  addIdeNode: ({ title, html, position, workspaceId } = {}) => {
    const s = get()
    const wsId = workspaceId ?? s.activeWorkspaceId
    const id = `ide_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const pos = position ?? clusterSpawnPosition(s, wsId)
    const z = nextZ()
    const node = {
      id,
      type: 'ideNode',
      position: pos,
      data: {
        title: title ?? 'Live IDE Preview',
        code: html ?? '<!doctype html>\n<html>\n  <head><meta charset="utf-8" /><title>Live IDE</title></head>\n  <body><h1>Hello from Canvascape</h1></body>\n</html>',
        workspaceId: wsId,
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
  addAICanvasNode: ({ position, workspaceId } = {}) => {
    const s = get()
    const wsId = workspaceId ?? s.activeWorkspaceId
    const id = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const pos = position ?? clusterSpawnPosition(s, wsId)
    const z = nextZ()
    const node = {
      id,
      type: 'aiNode',
      position: pos,
      data: { messages: [], createdAt: Date.now(), workspaceId: wsId },
      style: { width: 360, height: 520, zIndex: z },
      zIndex: z,
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

    const id = `settings_${Date.now()}`
    const pos = position ?? { x: 200 + Math.random() * 200, y: 80 + Math.random() * 160 }
    const z = nextZ()
    const node = {
      id,
      type: 'settingsNode',
      position: pos,
      data: { title: 'Settings', createdAt: Date.now() },
      style: { width: 500, height: 600, zIndex: z },
      zIndex: z,
      dragHandle: '.node-drag-handle',
    }
    set((s) => ({ nodes: [...s.nodes, node], activeNodeId: id }))
    _save(get())
    return id
  },

  // ── Add group frame ─────────────────────────────────────────────────────────
  addGroupNode: ({ position, workspaceId } = {}) => {
    const s = get()
    const workspaces = s.workspaces
    const ws = workspaces.find((w) => w.id === workspaceId) ?? s.getActiveWorkspace()
    const id = `group_${Date.now()}`
    const node = {
      id,
      type: 'groupFrame',
      position: position ?? { x: 60, y: 60 },
      data: { label: ws?.label ?? 'Group', color: ws?.color ?? '#A78BFA', bg: ws?.bg ?? 'rgba(167,139,250,0.08)', workspaceId: ws?.id ?? null },
      style: { width: 820, height: 560 },
      zIndex: 1,
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
        id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        url: node.data.url,
        title: node.data.title,
        favicon: node.data.favicon,
        note: node.data.note || '',
        closedAt: Date.now(),
        pinned: node.data.pinned || false,
      }
      set((s) => ({
        workspaces: s.workspaces.map(w =>
          w.id === (node.data.workspaceId || s.activeWorkspaceId)
            ? { ...w, sessionHistory: [histEntry, ...w.sessionHistory].slice(0, 40) }
            : w
        ),
        nodes: s.nodes.filter((n) => n.id !== id),
        activeNodeId: s.activeNodeId === id ? null : s.activeNodeId,
      }))
    } else {
      set((s) => ({
        nodes: s.nodes.filter((n) => n.id !== id),
        activeNodeId: s.activeNodeId === id ? null : s.activeNodeId,
      }))
    }
    _save(get())
  },

  duplicateNode: (id) => {
    const src = get().nodes.find((n) => n.id === id)
    if (!src) return
    const z = nextZ()
    const prefix = src.type.replace('Node', '').replace('Frame', '').toLowerCase()
    const newId = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const dup = {
      ...src,
      id: newId,
      position: { x: src.position.x + 40, y: src.position.y + 40 },
      zIndex: z,
      style: { ...src.style, zIndex: z },
      data: { ...src.data, createdAt: Date.now(), pinned: false, minimized: false, note: '', isNoteOpen: false },
    }
    set((s) => ({ nodes: [...s.nodes, dup], activeNodeId: newId }))
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
            minimized: willMinimize,
            _fullWidth: willMinimize ? (n.style?.width ?? 680) : n.data._fullWidth,
            _fullHeight: willMinimize ? (n.style?.height ?? 480) : n.data._fullHeight,
          },
          style: {
            ...n.style,
            zIndex: z,
            width: willMinimize ? 160 : Math.max(n.data._fullWidth ?? 1280, 1280),
            height: willMinimize ? 200 : Math.max(n.data._fullHeight ?? 800, 800),
          },
        }
      }),
    }))
    _save(get())
  },

  assignWorkspace: (nodeId, workspaceId) => {
    set((s) => ({ nodes: s.nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, workspaceId } } : n) }))
    _save(get())
  },

  // ── Notes ───────────────────────────────────────────────────────────────────
  toggleNotePanel: (id) => {
    set((s) => ({
      nodes: s.nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, isNoteOpen: !n.data.isNoteOpen } } : n)
    }))
    _save(get())
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
    const newTab = { url, title: title || url, favicon: favicon || null }
    const newTabs = [...existingTabs, newTab]
    const newIdx = newTabs.length - 1
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
    const newTabs = tabs.filter((_, i) => i !== tabIdx)
    const newActive = Math.min(tabIdx, newTabs.length - 1)
    const target = newTabs[newActive]
    set((s) => ({
      nodes: s.nodes.map((n) => n.id === nodeId
        ? { ...n, data: { ...n.data, tabs: newTabs, activeTabIdx: newActive, url: target.url, title: target.title, favicon: target.favicon, isLoading: true } }
        : n)
    }))
    _save(get())
  },

  // ── Session history ─────────────────────────────────────────────────────────
  clearHistory: () => {
    set((s) => ({
      workspaces: s.workspaces.map(w =>
        w.id === s.activeWorkspaceId ? { ...w, sessionHistory: [] } : w
      )
    }))
    _save(get())
  },
  restoreFromHistory: (histEntry) => {
    get().addWebNode({ url: histEntry.url, title: histEntry.title, favicon: histEntry.favicon, pinned: histEntry.pinned })
    // Remove from history after restore
    set((s) => ({
      workspaces: s.workspaces.map(w =>
        w.id === s.activeWorkspaceId
          ? { ...w, sessionHistory: w.sessionHistory.filter((h) => h.id !== histEntry.id) }
          : w
      )
    }))
    _save(get())
  },
  groupWorkspaceTabsWithAI: async (workspaceId) => {
    const startedAt = Date.now()
    const initial = get()
    const wsId = workspaceId ?? initial.activeWorkspaceId
    const workspace = initial.workspaces.find((w) => w.id === wsId)

    if (!workspace) return { ok: false, reason: 'workspace-not-found' }

    const currentWebNodes = initial.nodes.filter((n) => n.type === 'webNode' && n.data?.workspaceId === wsId)
    if (!currentWebNodes.length) {
      set((s) => ({
        workspaceGroupingStatus: {
          ...s.workspaceGroupingStatus,
          [wsId]: {
            state: 'idle',
            message: 'No tabs to group',
            groupedTabs: 0,
            groups: 0,
            updatedAt: Date.now(),
          },
        },
      }))
      return { ok: false, reason: 'no-tabs' }
    }

    set((s) => ({
      workspaceGroupingStatus: {
        ...s.workspaceGroupingStatus,
        [wsId]: {
          state: 'running',
          message: 'Grouping tabs...',
          groupedTabs: currentWebNodes.length,
          groups: 0,
          updatedAt: Date.now(),
        },
      },
    }))

    let grouped = null
    let usedFallback = false
    let failureMessage = ''

    try {
      grouped = await requestOllamaTabGroups(currentWebNodes, workspace.label, initial.aiProvider?.ollama)
    } catch (err) {
      usedFallback = true
      failureMessage = err?.message || 'AI grouping failed.'
    }

    if (!grouped || !grouped.length) {
      grouped = buildFallbackGroups(currentWebNodes)
      usedFallback = true
    }

    const latest = get()
    const ws = latest.workspaces.find((w) => w.id === wsId)
    const webNodes = latest.nodes.filter((n) => n.type === 'webNode' && n.data?.workspaceId === wsId)
    if (!webNodes.length) {
      set((s) => ({
        workspaceGroupingStatus: {
          ...s.workspaceGroupingStatus,
          [wsId]: {
            state: 'idle',
            message: 'No tabs to group',
            groupedTabs: 0,
            groups: 0,
            updatedAt: Date.now(),
          },
        },
      }))
      return { ok: false, reason: 'no-tabs' }
    }

    const validIds = new Set(webNodes.map((n) => n.id))
    const seen = new Set()
    const sanitized = []
    for (const group of grouped) {
      const ids = (group.tabIds || []).filter((id) => validIds.has(id) && !seen.has(id))
      if (!ids.length) continue
      ids.forEach((id) => seen.add(id))
      sanitized.push({ name: group.name || 'Group', tabIds: ids })
    }

    const missing = webNodes.map((n) => n.id).filter((id) => !seen.has(id))
    if (missing.length) sanitized.push({ name: 'Ungrouped', tabIds: missing })

    const seedCenter = viewportToCanvasCenter(ws?.viewport) ?? latest.viewportCenter ?? { x: 0, y: 0 }
    const center = clusterCenter(webNodes, seedCenter)
    const placements = buildGroupedPositions(sanitized, webNodes, center)
    const groupedAt = Date.now()

    set((s) => ({
      nodes: s.nodes.map((node) => {
        const placement = placements.get(node.id)
        if (!placement) return node
        return {
          ...node,
          position: { x: placement.x, y: placement.y },
          data: {
            ...node.data,
            aiGroup: placement.groupName,
            aiGroupedAt: groupedAt,
          },
        }
      }),
      workspaceGroupingStatus: {
        ...s.workspaceGroupingStatus,
        [wsId]: {
          state: 'done',
          message: usedFallback
            ? (failureMessage ? `Heuristic grouping used (${failureMessage})` : 'Heuristic grouping used')
            : 'Grouped with Ollama',
          groupedTabs: placements.size,
          groups: sanitized.length,
          usedFallback,
          model: initial.aiProvider?.ollama?.model || 'llama3.2',
          durationMs: groupedAt - startedAt,
          updatedAt: groupedAt,
        },
      },
    }))

    _save(get())
    return {
      ok: true,
      workspaceId: wsId,
      groupedTabs: placements.size,
      groups: sanitized.length,
      usedFallback,
      message: failureMessage,
    }
  },
  groupAllWorkspacesWithAI: async () => {
    const ids = get().workspaces.map((w) => w.id)
    const results = []
    for (const wsId of ids) {
      // eslint-disable-next-line no-await-in-loop
      const result = await get().groupWorkspaceTabsWithAI(wsId)
      results.push({ workspaceId: wsId, ...result })
    }
    return results
  },

  // ── Workspaces ──────────────────────────────────────────────────────────────
  addWorkspace: (label) => {
    const s = get()
    const idx = s.workspaces.length % PALETTE.length
    const id = `ws_${Date.now()}`
    set((s) => ({
      workspaces: [...s.workspaces, { id, label, ...PALETTE[idx], sessionHistory: [], viewport: { x: 0, y: 0, zoom: 1 } }],
      activeWorkspaceId: id,
    }))
    _save(get())
    return id
  },
  renameWorkspace: (id, label) => {
    set((s) => ({ workspaces: s.workspaces.map((w) => w.id === id ? { ...w, label } : w) }))
    _save(get())
  },
  updateWorkspace: (id, patch) => {
    set((s) => ({
      workspaces: s.workspaces.map((w) => w.id === id ? { ...w, ...patch } : w),
      nodes: s.nodes.map((n) => n.data?.workspaceId === id ? { ...n, data: { ...n.data, color: patch.color ?? n.data.color, bg: patch.bg ?? n.data.bg } } : n)
    }))
    _save(get())
  },
  removeWorkspace: (id) => {
    if (get().workspaces.length <= 1) {
      alert('You cannot delete the last workspace.')
      return
    }
    set((s) => {
      const nextWs = s.workspaces.filter((w) => w.id !== id)
      const newActiveId = s.activeWorkspaceId === id ? (nextWs[0]?.id ?? null) : s.activeWorkspaceId
      return {
        workspaces: nextWs,
        activeWorkspaceId: newActiveId,
        nodes: s.nodes.map((n) => n.data?.workspaceId === id ? { ...n, data: { ...n.data, workspaceId: newActiveId } } : n),
      }
    })
    _save(get())
  },

  // ── UI state ────────────────────────────────────────────────────────────────
  setFilter: (f) => { set({ filter: f }); _save(get()) },
  toggleSidebar: () => { set((s) => ({ isSidebarOpen: !s.isSidebarOpen })); _save(get()) },
  setComposerOpen: (val) => set({ isComposerOpen: val }),
  setCommandOpen: (val) => set({ isCommandOpen: val }),
  toggleAIPanel: () => { set((s) => ({ isAIPanelOpen: !s.isAIPanelOpen })); _save(get()) },
  setAIPanelOpen: (val) => { set({ isAIPanelOpen: val }); _save(get()) },
  toggleTheme: () => {
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
      if (saved) {
        if (saved.nodes?.length) {
          _zCounter = saved.nodes.reduce((m, n) => Math.max(m, n.zIndex ?? 0), 100)
        }
        const theme = saved.theme ?? 'dark'
        document.documentElement.setAttribute('data-theme', theme)

        // Handle migration from old versions
        let workspaces = saved.workspaces ?? (saved.categories?.map(c => ({
          ...c,
          sessionHistory: saved.sessionHistory ?? [],
          viewport: saved.viewport ?? { x: 0, y: 0, zoom: 1 }
        })) ?? DEFAULT_WORKSPACES)

        // Normalize workspace metadata for cluster-based layout.
        workspaces = workspaces.map((w) => ({
          ...w,
          sessionHistory: w.sessionHistory ?? [],
          viewport: w.viewport ?? { x: 0, y: 0, zoom: 1 },
        }))
        const nodes = saved.nodes ?? []

        const activeWorkspaceId = saved.activeWorkspaceId ?? (saved.activeCategoryId ?? workspaces[0].id)

        set({
          nodes,
          edges: saved.edges ?? [],
          workspaces,
          activeWorkspaceId,
          theme,
          isSidebarOpen: saved.isSidebarOpen ?? true,
          isAIPanelOpen: saved.isAIPanelOpen ?? false,
          filter: saved.filter ?? 'all',
          aiProvider: saved.aiProvider ?? get().aiProvider,
          aiConversations: saved.aiConversations ?? [],
          aiCurrentId: saved.aiCurrentId ?? (saved.aiConversations?.[0]?.id ?? null),
          aiContextEnabled: saved.aiContextEnabled ?? true,
          workspaceGroupingStatus: {},
        })
      }
    } catch (e) { console.error('Load failed', e) }
    finally { set({ isLoading: false }) }
  },
}))

