import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { normalizeUrl, titleFromUrl, faviconUrl } from '../../utils/urlUtils'

// ── Static action definitions ──────────────────────────────────────────────
const ACTIONS = [
  { id: 'fitview',         label: 'Fit all tabs in view',  icon: FitIcon,    section: 'Actions', shortcut: null },
  { id: 'toggle-sidebar',  label: 'Toggle sidebar',         icon: SidebarIcon, section: 'Actions', shortcut: 'Ctrl+\\' },
  { id: 'toggle-theme',    label: 'Toggle theme',           icon: ThemeIcon,  section: 'Actions', shortcut: null },
  { id: 'new-tab',         label: 'New tab',                icon: PlusIcon,   section: 'Actions', shortcut: 'Ctrl+N' },
  { id: 'clear-history',   label: 'Clear session history',  icon: TrashIcon,  section: 'Actions', shortcut: null },
  { id: 'toggle-ai',       label: 'Toggle AI assistant',    icon: SparkleIcon, section: 'Actions', shortcut: 'Ctrl+Shift+A' },
]

export default function CommandPalette() {
  const {
    isCommandOpen, setCommandOpen,
    nodes, addWebNode, setActiveNode,
    toggleSidebar, toggleTheme, setComposerOpen,
    sessionHistory, restoreFromHistory, clearHistory,
    theme,
  } = useWorkspaceStore()

  const [query,    setQuery]   = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef  = useRef(null)
  const listRef   = useRef(null)
  const isDark    = theme === 'dark'

  // Keyboard shortcut to open
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen(true)
      }
      if (e.key === 'Escape' && isCommandOpen) setCommandOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isCommandOpen, setCommandOpen])

  // Reset on open
  useEffect(() => {
    if (isCommandOpen) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isCommandOpen])

  const webNodes = useMemo(
    () => nodes.filter((n) => n.type === 'webNode' && !n.data.minimized),
    [nodes]
  )

  // Build filtered result list
  const results = useMemo(() => {
    const q = query.toLowerCase().trim()
    const items = []

    // Actions
    const matchedActions = ACTIONS.filter((a) => !q || a.label.toLowerCase().includes(q))
    matchedActions.forEach((a) => items.push({ kind: 'action', ...a }))

    // Open URL / search (only when query looks like url or search)
    if (q) {
      items.push({ kind: 'open', id: 'open-url', label: normalizeUrl(q), section: 'Open', icon: GlobeIcon })
    }

    // Jump to open card
    const matchedNodes = webNodes.filter((n) =>
      !q || n.data.title?.toLowerCase().includes(q) || n.data.url?.toLowerCase().includes(q)
    )
    matchedNodes.forEach((n) => items.push({ kind: 'node', id: n.id, label: n.data.title || n.data.url, url: n.data.url, favicon: n.data.favicon, section: 'Open Cards' }))

    // Session history
    const matchedHist = sessionHistory.filter((h) =>
      !q || h.title?.toLowerCase().includes(q) || h.url?.toLowerCase().includes(q)
    ).slice(0, 8)
    matchedHist.forEach((h) => items.push({ kind: 'history', ...h, section: 'Recently Closed' }))

    return items
  }, [query, webNodes, sessionHistory])

  // Keyboard navigation
  useEffect(() => { setSelected(0) }, [query])

  const execute = useCallback((item) => {
    if (!item) return
    setCommandOpen(false)
    setQuery('')

    if (item.kind === 'action') {
      if (item.id === 'fitview')        window.dispatchEvent(new CustomEvent('canvas:fitview'))
      if (item.id === 'toggle-sidebar') toggleSidebar()
      if (item.id === 'toggle-theme')   toggleTheme()
      if (item.id === 'new-tab')        setComposerOpen(true)
      if (item.id === 'clear-history')  clearHistory()
      if (item.id === 'toggle-ai')       useWorkspaceStore.getState().toggleAIPanel()
    }
    if (item.kind === 'open') {
      const url = normalizeUrl(query)
      addWebNode({ url, title: titleFromUrl(url), favicon: faviconUrl(url) })
    }
    if (item.kind === 'node') {
      window.dispatchEvent(new CustomEvent('canvas:flyto', { detail: { nodeId: item.id } }))
      setActiveNode(item.id)
    }
    if (item.kind === 'history') {
      restoreFromHistory(item)
    }
  }, [query, addWebNode, toggleSidebar, toggleTheme, setComposerOpen, clearHistory, restoreFromHistory, setCommandOpen, setActiveNode])

  const onKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)) }
    if (e.key === 'Enter')     { e.preventDefault(); execute(results[selected]) }
    if (e.key === 'Escape')    { setCommandOpen(false) }
    e.stopPropagation()
  }, [results, selected, execute, setCommandOpen])

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selected]
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  // Color tokens
  const bg     = isDark ? '#141310' : '#FAFAF7'
  const border = isDark ? 'rgba(255,245,220,0.11)' : 'rgba(100,80,40,0.14)'
  const divider = isDark ? 'rgba(255,245,220,0.06)' : 'rgba(100,80,40,0.08)'

  // Group by section for rendering
  const sections = useMemo(() => {
    const map = new Map()
    results.forEach((r) => {
      const sec = r.section || 'Other'
      if (!map.has(sec)) map.set(sec, [])
      map.get(sec).push(r)
    })
    return map
  }, [results])

  // Flat list of items for keyboard nav (same order as rendered)
  const flatList = useMemo(() => {
    const flat = []
    sections.forEach((items) => items.forEach((item) => flat.push(item)))
    return flat
  }, [sections])

  // Re-map selected to flatList
  const selectedItem = flatList[selected]

  return (
    <AnimatePresence>
      {isCommandOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cp-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 500,
              background: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(20,15,5,0.35)',
              backdropFilter: 'blur(6px)',
            }}
            onClick={() => setCommandOpen(false)}
          />

          {/* Palette */}
          <motion.div
            key="cp-panel"
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed', zIndex: 501,
              top: '22%', left: '50%', transform: 'translateX(-50%)',
              width: 'min(580px, calc(100vw - 24px))',
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: 18,
              boxShadow: isDark
                ? '0 0 0 1px rgba(255,245,220,0.04), 0 32px 80px rgba(0,0,0,0.9), 0 8px 32px rgba(0,0,0,0.6)'
                : '0 0 0 1px rgba(100,80,40,0.06), 0 32px 80px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            {/* Top accent line */}
            <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, var(--a) 30%, var(--a2) 70%, transparent)', opacity: 0.8 }} />

            {/* Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: `1px solid ${divider}` }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--t3)', flexShrink: 0 }}>
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search actions, jump to card, paste URL…"
                style={{
                  flex: 1, border: 'none', outline: 'none', background: 'transparent',
                  color: 'var(--t1)', fontSize: 15, fontFamily: 'inherit',
                }}
              />
              {query && (
                <button onClick={() => setQuery('')} style={{ color: 'var(--t3)', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
              )}
              <kbd style={{ padding: '2px 7px', borderRadius: 6, background: 'var(--s3)', border: '1px solid var(--bd)', fontSize: 10, fontFamily: "'DM Mono', monospace", color: 'var(--t3)', flexShrink: 0 }}>Esc</kbd>
            </div>

            {/* Results */}
            <div style={{ maxHeight: 360, overflowY: 'auto', padding: '6px 0' }}>
              {results.length === 0 ? (
                <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>
                  No results
                </div>
              ) : (
                (() => {
                  let globalIdx = 0
                  const rendered = []
                  sections.forEach((items, sectionName) => {
                    rendered.push(
                      <div key={`sec-${sectionName}`} style={{ padding: '8px 18px 4px', fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--t3)' }}>
                        {sectionName}
                      </div>
                    )
                    items.forEach((item) => {
                      const idx = globalIdx++
                      const isSelected = flatList[selected]?.id === item.id && flatList[selected]?.kind === item.kind
                      rendered.push(
                        <ResultRow
                          key={`${item.kind}-${item.id}`}
                          item={item}
                          isSelected={isSelected}
                          isDark={isDark}
                          onClick={() => execute(item)}
                          onMouseEnter={() => setSelected(idx)}
                        />
                      )
                    })
                  })
                  return rendered
                })()
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: 16, padding: '10px 18px', borderTop: `1px solid ${divider}` }}>
              {[['↑↓', 'Navigate'], ['↵', 'Select'], ['Esc', 'Close']].map(([k, l]) => (
                <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--t3)' }}>
                  <kbd style={{ padding: '2px 6px', borderRadius: 5, background: 'var(--s3)', border: '1px solid var(--bd)', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--t3)' }}>{k}</kbd>
                  {l}
                </span>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Result row ────────────────────────────────────────────────────────────────
function ResultRow({ item, isSelected, isDark, onClick, onMouseEnter }) {
  const selBg    = isDark ? 'rgba(255,245,220,0.06)' : 'rgba(100,80,40,0.06)'
  const selColor = 'var(--a)'

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        margin: '1px 8px', padding: '9px 12px', borderRadius: 10,
        background: isSelected ? selBg : 'transparent',
        cursor: 'pointer', transition: 'background 0.1s',
      }}
    >
      {/* Icon */}
      <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? 'var(--a-bg)' : (isDark ? 'rgba(255,245,220,0.04)' : 'rgba(100,80,40,0.05)'), border: `1px solid ${isSelected ? 'var(--bd-a)' : 'var(--bd)'}` }}>
        {item.kind === 'history' || item.kind === 'node' ? (
          item.favicon
            ? <img src={item.favicon} style={{ width: 14, height: 14, borderRadius: 3 }} onError={(e) => e.target.style.display = 'none'}/>
            : <GlobeIcon size={13} color={isSelected ? selColor : 'var(--t3)'}/>
        ) : (
          item.icon ? <item.icon size={13} color={isSelected ? selColor : 'var(--t3)'}/> : null
        )}
      </div>

      {/* Label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: isSelected ? 'var(--t1)' : 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.label}
        </div>
        {(item.kind === 'node' || item.kind === 'history') && (
          <div style={{ fontSize: 10.5, color: 'var(--t3)', fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
            {item.url}
          </div>
        )}
        {item.kind === 'history' && (
          <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 1 }}>
            Closed {formatTime(item.closedAt)}
          </div>
        )}
      </div>

      {/* Shortcut or badge */}
      {item.shortcut && (
        <kbd style={{ flexShrink: 0, padding: '2px 7px', borderRadius: 6, background: 'var(--s3)', border: '1px solid var(--bd)', fontSize: 10, fontFamily: "'DM Mono', monospace", color: 'var(--t3)' }}>
          {item.shortcut}
        </kbd>
      )}
      {item.kind === 'history' && (
        <span style={{ flexShrink: 0, fontSize: 10, padding: '2px 7px', borderRadius: 999, background: 'var(--s3)', color: 'var(--t3)', border: '1px solid var(--bd)' }}>
          restore
        </span>
      )}
      {item.kind === 'node' && (
        <span style={{ flexShrink: 0, fontSize: 10, padding: '2px 7px', borderRadius: 999, background: 'var(--a-bg)', color: 'var(--a)', border: '1px solid var(--bd-a)' }}>
          open
        </span>
      )}
    </div>
  )
}

function formatTime(ts) {
  if (!ts) return ''
  const diff = Date.now() - ts
  if (diff < 60000)   return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(ts).toLocaleDateString()
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function GlobeIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.4"/>
      <path d="M2 8h12M8 2c-2 2-2 8 0 12M8 2c2 2 2 8 0 12" stroke={color} strokeWidth="1.4"/>
    </svg>
  )
}
function FitIcon({ size = 13, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function SidebarIcon({ size = 13, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2" stroke={color} strokeWidth="1.4"/>
      <path d="M6 2v12" stroke={color} strokeWidth="1.4"/>
    </svg>
  )
}
function ThemeIcon({ size = 13, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M13.5 9A6 6 0 0 1 7 2.5 5.5 5.5 0 1 0 13.5 9z" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}
function PlusIcon({ size = 13, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )
}
function TrashIcon({ size = 13, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 4h10M6 4V3h4v1M5 4l1 9h4l1-9" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function SparkleIcon({ size = 13, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5L9.5 6.5H14.5L10.5 9.5L12 14.5L8 11.5L4 14.5L5.5 9.5L1.5 6.5H6.5L8 1.5Z" stroke={color} strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  )
}
