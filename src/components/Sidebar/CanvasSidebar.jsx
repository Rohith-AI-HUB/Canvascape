import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, LayoutGroup } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'

export default function CanvasSidebar() {
  const { nodes, workspaces, activeWorkspaceId, setActiveWorkspaceId, addWorkspace, updateWorkspace, removeWorkspace,
    setComposerOpen, restoreFromHistory, getActiveWorkspace, groupWorkspaceTabsWithAI, groupAllWorkspacesWithAI, workspaceGroupingStatus } = useWorkspaceStore()
  const [addingCat, setAddingCat] = useState(false)
  const [newLabel,  setNewLabel]  = useState('')
  const [editId,    setEditId]    = useState(null)
  const [editLabel, setEditLabel] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [hoveredWs, setHoveredWs] = useState(null)
  const [isCompactCarousel, setIsCompactCarousel] = useState(false)
  const sidebarRef = useRef(null)
  const scrollRef = useRef(null)

  const activeWorkspace = getActiveWorkspace()
  const sessionHistory = activeWorkspace?.sessionHistory || []
  const webNodes      = nodes.filter(n => n.type === 'webNode')
  const filteredNodes = webNodes.filter(n => n.data?.workspaceId === activeWorkspaceId || (!activeWorkspaceId && !n.data?.workspaceId))
  
  const flyTo  = id => window.dispatchEvent(new CustomEvent('canvas:flyto', { detail: { nodeId: id } }))
  const commitAdd  = () => { if (newLabel.trim()) addWorkspace(newLabel.trim()); setAddingCat(false); setNewLabel('') }
  const commitEdit = () => {
    if (editLabel.trim() && editId) {
      updateWorkspace(editId, { label: editLabel.trim() })
    }
    setEditId(null)
  }

  const allWorkspaces = workspaces
  const workspaceMeta = useMemo(() => {
    const meta = new Map()
    for (const ws of allWorkspaces) {
      const wsNodes = nodes.filter((n) => n.data?.workspaceId === ws.id)
      const wsWebNodes = wsNodes.filter((n) => n.type === 'webNode')
      meta.set(ws.id, {
        webCount: wsWebNodes.length,
        pinnedCount: wsNodes.filter((n) => n.data?.pinned).length,
        loadingCount: wsWebNodes.filter((n) => n.data?.isLoading).length,
        previewFavicons: wsWebNodes.map((n) => n.data?.favicon).filter(Boolean).slice(0, 3),
        previewTitle: wsWebNodes[0]?.data?.title || null,
      })
    }
    return meta
  }, [allWorkspaces, nodes])
  
  const switchWorkspace = (dir) => {
    if (!allWorkspaces.length) return
    const idx = allWorkspaces.findIndex(c => c.id === activeWorkspaceId)
    if (idx < 0) return
    let next = idx + dir
    if (next < 0) next = allWorkspaces.length - 1
    if (next >= allWorkspaces.length) next = 0
    setActiveWorkspaceId(allWorkspaces[next].id)
  }

  const canCycle = allWorkspaces.length > 1
  const activeGrouping = workspaceGroupingStatus?.[activeWorkspaceId]
  const isGroupingActiveWorkspace = activeGrouping?.state === 'running'
  const isAnyGrouping = Object.values(workspaceGroupingStatus || {}).some((entry) => entry?.state === 'running')

  const workspaceHint = isGroupingActiveWorkspace
    ? 'AI grouping active workspace...'
    : activeGrouping?.state === 'done'
      ? `${activeGrouping.groupedTabs} tabs • ${activeGrouping.groups} groups`
      : `${allWorkspaces.length} clusters - use Left/Right keys`
  const onCarouselKeyDown = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); switchWorkspace(-1) }
    if (e.key === 'ArrowRight') { e.preventDefault(); switchWorkspace(1) }
    if (e.key === 'Home' && allWorkspaces.length) { e.preventDefault(); setActiveWorkspaceId(allWorkspaces[0].id) }
    if (e.key === 'End' && allWorkspaces.length) { e.preventDefault(); setActiveWorkspaceId(allWorkspaces[allWorkspaces.length - 1].id) }
  }

  useEffect(() => {
    const onMouseDown = (e) => {
      // Mouse button 3 is backward, 4 is forward
      if (e.button === 3) { e.preventDefault(); switchWorkspace(-1) }
      if (e.button === 4) { e.preventDefault(); switchWorkspace(1) }
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [activeWorkspaceId, workspaces])

  // Scroll active workspace into view
  useEffect(() => {
    const activeEl = scrollRef.current?.querySelector('[data-active="true"]')
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [activeWorkspaceId, isCompactCarousel, allWorkspaces.length])

  useEffect(() => {
    const el = sidebarRef.current
    if (!el) return

    const updateDensity = (w) => setIsCompactCarousel(w < 245)
    updateDensity(el.clientWidth || 260)

    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const width = entries?.[0]?.contentRect?.width
      if (Number.isFinite(width)) updateDensity(width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const PALETTE = [
    { color: '#A78BFA', bg: 'rgba(167,139,250,0.08)' },
    { color: '#60A5FA', bg: 'rgba(96,165,250,0.08)'  },
    { color: '#34D399', bg: 'rgba(52,211,153,0.08)'  },
    { color: '#F97316', bg: 'rgba(249,115,22,0.08)'  },
    { color: '#F472B6', bg: 'rgba(244,114,182,0.08)' },
    { color: '#FBBF24', bg: 'rgba(251,191,36,0.08)'  },
    { color: '#EF4444', bg: 'rgba(239,68,68,0.08)'   },
    { color: '#10B981', bg: 'rgba(16,185,129,0.08)'  },
  ]

  const EMOJIS = ['💼', '🔬', '🏠', '🎨', '📚', '🚀', '🧠', '⚡', '🌟', '🎮', '🍎', '🌈']

  return (
    <div ref={sidebarRef} style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--s1)', borderRight: '1px solid var(--bd)',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* â”€â”€ Pinned Grid â”€â”€ */}
      <PinnedGrid nodes={nodes} onFly={flyTo} sessionHistory={sessionHistory} restoreFromHistory={restoreFromHistory} setComposerOpen={setComposerOpen} />

      {/* â”€â”€ New Tab Button â”€â”€ */}
      <button
        onClick={() => setComposerOpen(true)}
        style={{
          margin: '10px 12px 2px', display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 12,
          border: '1px solid var(--bd-a)', background: 'var(--a-bg)',
          color: 'var(--a)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          cursor: 'pointer', transition: 'all 140ms', textAlign: 'left',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--a-bg2)'; e.currentTarget.style.boxShadow = '0 4px 16px var(--a-glow)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--a-bg)'; e.currentTarget.style.boxShadow = 'none' }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Open a new tab
        <kbd style={{ marginLeft: 'auto', fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.5, fontWeight: 400 }}>Ctrl+N</kbd>
      </button>

      {/* â”€â”€ Active Workspace label â”€â”€ */}
      <div style={{ padding: '12px 16px 4px', display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
        {editId === activeWorkspace?.id ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div 
              onClick={() => setShowPicker(!showPicker)}
              onMouseDown={e => e.preventDefault()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, cursor: 'pointer', borderRadius: 6, background: 'var(--s2)', border: '1px solid var(--bd)' }}
            >
              {activeWorkspace?.emoji ? (
                <span style={{ fontSize: 14 }}>{activeWorkspace.emoji}</span>
              ) : (
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: activeWorkspace?.color || 'var(--t4)' }} />
              )}
            </div>
            <input
              autoFocus
              value={editLabel}
              onChange={e => setEditLabel(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitEdit()
                if (e.key === 'Escape') setEditId(null)
              }}
              onBlur={() => { if (!showPicker) commitEdit() }}
              style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid var(--a)', color: 'var(--t1)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', outline: 'none', padding: '2px 0' }}
            />
            <button 
              onClick={commitEdit}
              style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--a)', display: 'flex', alignItems: 'center' }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showPicker && (
              <div 
                onMouseDown={e => e.preventDefault()}
                style={{ position: 'absolute', top: 38, left: 16, background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 12, padding: 12, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', width: 180 }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Color</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                  {PALETTE.map(p => (
                    <div key={p.color} 
                      onClick={() => updateWorkspace(activeWorkspace.id, { color: p.color, bg: p.bg, emoji: null })}
                      style={{ width: 24, height: 24, borderRadius: '50%', background: p.color, cursor: 'pointer', border: (!activeWorkspace.emoji && activeWorkspace.color === p.color) ? '2px solid var(--t1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                    />
                  ))}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Emoji</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {EMOJIS.map(em => (
                    <div key={em} 
                      onClick={() => updateWorkspace(activeWorkspace.id, { emoji: em })}
                      style={{ fontSize: 16, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 6, background: activeWorkspace.emoji === em ? 'var(--s3)' : 'transparent', border: activeWorkspace.emoji === em ? '1px solid var(--bd)' : '1px solid transparent' }}
                    >
                      {em}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              {activeWorkspace?.emoji ? (
                <span style={{ fontSize: 12 }}>{activeWorkspace.emoji}</span>
              ) : (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: activeWorkspace?.color || 'var(--t4)' }} />
              )}
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--t2)' }}>
                {activeWorkspace?.label || 'Unsorted'}
              </span>
            </div>
            {activeWorkspace && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <button 
                  onClick={() => { setEditId(activeWorkspace.id); setEditLabel(activeWorkspace.label) }}
                  style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--t4)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--t2)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--t4)'}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${activeWorkspace.label}"? This cannot be undone.`)) {
                      removeWorkspace(activeWorkspace.id)
                    }
                  }}
                  style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--t4)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--t4)'}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M3 4h10M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1m2 0v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4h10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* â”€â”€ Tree (Only nodes of active workspace) â”€â”€ */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 12px', scrollbarWidth: 'thin' }}>
        {filteredNodes.length > 0 ? (
          filteredNodes.map(n => <TabRow key={n.id} node={n} onFly={flyTo} accent={activeWorkspace?.color}/>)
        ) : (
          <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ color: 'var(--t4)', fontSize: 12.5 }}>No tabs in this workspace</div>
            <button
              onClick={() => setComposerOpen(true)}
              style={{
                padding: '8px 16px', borderRadius: 10, border: '1px solid var(--bd-a)',
                background: 'var(--a-bg)', color: 'var(--a)', fontSize: 12.5, fontWeight: 600,
                cursor: 'pointer', transition: 'all 140ms', fontFamily: 'inherit'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--a-bg2)'; e.currentTarget.style.boxShadow = '0 4px 12px var(--a-glow)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--a-bg)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              + New Tab
            </button>
          </div>
        )}
      </div>

      {/* Workspace Rail */}
      <div style={{
        borderTop: '1px solid var(--bd)',
        padding: '10px 10px 9px',
        background: 'linear-gradient(180deg, var(--s1), var(--s2))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--t3)' }}>
              Workspaces
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--t4)', marginTop: 1 }}>
              {workspaceHint}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <CarouselNavButton
              label="Previous workspace"
              disabled={!canCycle}
              onClick={() => switchWorkspace(-1)}
              icon={<path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
            />
            <CarouselNavButton
              label="Next workspace"
              disabled={!canCycle}
              onClick={() => switchWorkspace(1)}
              icon={<path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
            />
            <button
              aria-label="AI group active workspace tabs"
              title="AI group active workspace tabs"
              disabled={isGroupingActiveWorkspace}
              onClick={() => { groupWorkspaceTabsWithAI(activeWorkspaceId) }}
              style={{
                width: 30, height: 30, borderRadius: 9, border: '1px solid var(--bd-a)',
                background: isGroupingActiveWorkspace ? 'var(--a-bg2)' : 'var(--a-bg)', color: 'var(--a)',
                cursor: isGroupingActiveWorkspace ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 160ms',
                boxShadow: isGroupingActiveWorkspace ? '0 0 0 1px var(--a-glow)' : 'inset 0 1px 0 rgba(255,255,255,0.03)',
                opacity: isGroupingActiveWorkspace ? 0.88 : 1,
              }}
              onMouseEnter={e => {
                if (isGroupingActiveWorkspace) return
                e.currentTarget.style.background = 'var(--a-bg2)'
                e.currentTarget.style.boxShadow = '0 6px 16px var(--a-glow)'
              }}
              onMouseLeave={e => {
                if (isGroupingActiveWorkspace) return
                e.currentTarget.style.background = 'var(--a-bg)'
                e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.03)'
              }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M3 3h4v4H3V3zm6 0h4v4H9V3zM3 9h4v4H3V9zm6 0h4v4H9V9z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
                <path d="M11.5 1.5v2M10.5 2.5h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
            <button
              aria-label="AI group all workspaces"
              title="AI group all workspaces"
              disabled={isAnyGrouping}
              onClick={() => { groupAllWorkspacesWithAI() }}
              style={{
                width: 30, height: 30, borderRadius: 9, border: '1px solid var(--bd)',
                background: 'var(--s1)', color: isAnyGrouping ? 'var(--t4)' : 'var(--t3)', cursor: isAnyGrouping ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 160ms', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)', opacity: isAnyGrouping ? 0.6 : 1,
              }}
              onMouseEnter={e => {
                if (isAnyGrouping) return
                e.currentTarget.style.background = 'var(--s3)'
                e.currentTarget.style.color = 'var(--t1)'
              }}
              onMouseLeave={e => {
                if (isAnyGrouping) return
                e.currentTarget.style.background = 'var(--s1)'
                e.currentTarget.style.color = 'var(--t3)'
              }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M2.5 2.5h5v5h-5v-5zm6 0h5v5h-5v-5zm-6 6h5v5h-5v-5zm6 6h5v-5h-5v5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              aria-label="Add new workspace"
              onClick={() => setAddingCat(true)}
              style={{
                width: 30, height: 30, borderRadius: 9, border: '1px solid var(--bd-a)',
                background: 'var(--a-bg)', color: 'var(--a)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 160ms', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--a-bg2)'; e.currentTarget.style.boxShadow = '0 6px 16px var(--a-glow)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--a-bg)'; e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.03)' }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          role="tablist"
          aria-label="Workspace carousel"
          tabIndex={0}
          onKeyDown={onCarouselKeyDown}
          style={{
            display: 'grid',
            gridAutoFlow: 'column',
            gridAutoColumns: isCompactCarousel ? 'minmax(122px, 1fr)' : 'minmax(154px, 1fr)',
            gap: 8,
            overflowX: 'auto',
            padding: '1px 1px 6px',
            scrollbarWidth: 'thin',
            scrollSnapType: 'x mandatory',
          }}
        >
          <LayoutGroup id="sidebar-workspaces">
            {allWorkspaces.map((ws) => {
              const isActive = activeWorkspaceId === ws.id
              const meta = workspaceMeta.get(ws.id) ?? {
                webCount: 0, pinnedCount: 0, loadingCount: 0, previewFavicons: [], previewTitle: null
              }
              const wsGrouping = workspaceGroupingStatus?.[ws.id]
              const wsIsGrouping = wsGrouping?.state === 'running'
              const wsGrouped = wsGrouping?.state === 'done'
              const showActions = hoveredWs === ws.id || isActive
              const canDelete = allWorkspaces.length > 1

              return (
                <motion.div
                  key={ws.id ?? 'unsorted'}
                  role="tab"
                  aria-selected={isActive}
                  data-active={isActive}
                  title={ws.label}
                  tabIndex={0}
                  layout
                  whileTap={{ scale: 0.985 }}
                  onClick={() => setActiveWorkspaceId(ws.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setActiveWorkspaceId(ws.id)
                    }
                  }}
                  onMouseEnter={() => setHoveredWs(ws.id)}
                  onMouseLeave={() => setHoveredWs((prev) => (prev === ws.id ? null : prev))}
                  onFocus={() => setHoveredWs(ws.id)}
                  onBlur={() => setHoveredWs((prev) => (prev === ws.id ? null : prev))}
                  style={{
                    position: 'relative',
                    minHeight: isCompactCarousel ? 92 : 100,
                    borderRadius: 12,
                    border: isActive ? `1px solid ${ws.color || 'var(--bd-a)'}` : '1px solid var(--bd)',
                    background: isActive ? (ws.bg || 'var(--a-bg)') : 'var(--s1)',
                    color: isActive ? 'var(--t1)' : 'var(--t2)',
                    padding: isCompactCarousel ? '9px 10px 8px' : '10px 11px 9px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    scrollSnapAlign: 'center',
                    boxShadow: isActive ? `0 0 0 1px ${ws.color}33, 0 8px 26px ${ws.color}22` : 'inset 0 1px 0 rgba(255,255,255,0.03)',
                    transition: 'all 180ms',
                    outline: 'none',
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-workspace-bg"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 12,
                        background: `linear-gradient(160deg, ${ws.bg || 'var(--a-bg)'}, transparent 90%)`,
                        pointerEvents: 'none',
                      }}
                      transition={{ type: 'spring', bounce: 0.16, duration: 0.45 }}
                    />
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, marginBottom: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: ws.color || 'var(--t4)', flexShrink: 0 }} />
                    {ws.emoji && <span style={{ fontSize: 12, lineHeight: 1 }}>{ws.emoji}</span>}
                    <span style={{ fontSize: 11.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ws.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                      {meta.previewFavicons.length ? (
                        meta.previewFavicons.map((favicon, i) => (
                          <img
                            key={`${ws.id}_preview_${i}`}
                            src={favicon}
                            alt=""
                            style={{
                              width: 15, height: 15, borderRadius: 4, border: '1px solid var(--bd)',
                              marginLeft: i === 0 ? 0 : -5, background: 'var(--s2)', objectFit: 'cover'
                            }}
                            onError={e => { e.currentTarget.style.display = 'none' }}
                          />
                        ))
                      ) : (
                        <span style={{ fontSize: 10, color: 'var(--t4)' }}>No preview</span>
                      )}
                    </div>
                    {!isCompactCarousel && (
                      <span style={{ fontSize: 10, color: 'var(--t4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {meta.previewTitle || 'No recent tab'}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    <WorkspaceStat>{meta.webCount} tabs</WorkspaceStat>
                    {meta.pinnedCount > 0 && <WorkspaceStat>{meta.pinnedCount} pinned</WorkspaceStat>}
                    {meta.loadingCount > 0 && <WorkspaceStat color="var(--a)">{meta.loadingCount} loading</WorkspaceStat>}
                    {wsIsGrouping && <WorkspaceStat color="var(--a)">grouping...</WorkspaceStat>}
                    {wsGrouped && !wsIsGrouping && <WorkspaceStat color="var(--a)">AI grouped</WorkspaceStat>}
                  </div>

                  <div style={{
                    position: 'absolute',
                    top: 7,
                    right: 7,
                    display: 'flex',
                    gap: 3,
                    opacity: showActions ? 1 : 0,
                    pointerEvents: showActions ? 'auto' : 'none',
                    transition: 'opacity 140ms ease',
                  }}>
                    <WorkspaceQuickAction
                      label="AI group workspace tabs"
                      disabled={wsIsGrouping}
                      onClick={(e) => {
                        e.stopPropagation()
                        groupWorkspaceTabsWithAI(ws.id)
                      }}
                      icon={<path d="M3 3h4v4H3V3zm6 0h4v4H9V3zM3 9h4v4H3V9zm6 0h4v4H9V9z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>}
                    />
                    <WorkspaceQuickAction
                      label="Rename workspace"
                      onClick={(e) => { e.stopPropagation(); setEditId(ws.id); setEditLabel(ws.label) }}
                      icon={<path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>}
                    />
                    <WorkspaceQuickAction
                      label={canDelete ? 'Delete workspace' : 'Cannot delete last workspace'}
                      disabled={!canDelete}
                      danger
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!canDelete) return
                        if (window.confirm(`Delete workspace "${ws.label}"?`)) removeWorkspace(ws.id)
                      }}
                      icon={<path d="M3 4h10M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1m2 0v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4h10z" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>}
                    />
                  </div>
                </motion.div>
              )
            })}
          </LayoutGroup>
        </div>

        {addingCat && (
          <div style={{ paddingTop: 5 }}>
            <input
              autoFocus
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onBlur={commitAdd}
              onKeyDown={e => e.key === 'Enter' && commitAdd()}
              placeholder="New workspace..."
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 9,
                border: '1px solid var(--bd-a)',
                background: 'var(--a-bg)',
                color: 'var(--t1)',
                fontSize: 12,
                outline: 'none',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function CarouselNavButton({ label, disabled, onClick, icon }) {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 30, height: 30, borderRadius: 9, border: '1px solid var(--bd)',
        background: 'var(--s1)', color: disabled ? 'var(--t4)' : 'var(--t3)',
        opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 140ms',
      }}
      onMouseEnter={e => {
        if (disabled) return
        e.currentTarget.style.background = 'var(--s3)'
        e.currentTarget.style.color = 'var(--t1)'
      }}
      onMouseLeave={e => {
        if (disabled) return
        e.currentTarget.style.background = 'var(--s1)'
        e.currentTarget.style.color = 'var(--t3)'
      }}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">{icon}</svg>
    </button>
  )
}

function WorkspaceStat({ children, color = 'var(--t3)' }) {
  return (
    <span style={{
      fontSize: 9.5, fontWeight: 600, color,
      background: 'var(--s2)', border: '1px solid var(--bd)',
      borderRadius: 999, padding: '1px 6px', lineHeight: 1.4,
    }}>
      {children}
    </span>
  )
}

function WorkspaceQuickAction({ label, onClick, icon, disabled = false, danger = false }) {
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 19, height: 19, borderRadius: 6, border: '1px solid var(--bd)',
        background: 'var(--s1)', color: disabled ? 'var(--t4)' : 'var(--t3)',
        opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 120ms',
      }}
      onMouseEnter={e => {
        if (disabled) return
        e.currentTarget.style.background = danger ? 'rgba(248,113,113,0.12)' : 'var(--s3)'
        e.currentTarget.style.color = danger ? '#F87171' : 'var(--t1)'
      }}
      onMouseLeave={e => {
        if (disabled) return
        e.currentTarget.style.background = 'var(--s1)'
        e.currentTarget.style.color = 'var(--t3)'
      }}
    >
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none">{icon}</svg>
    </button>
  )
}

function PinnedGrid({ nodes, onFly, sessionHistory, restoreFromHistory, setComposerOpen }) {
  const pinnedNodes = nodes.filter(n => n.data?.pinned).slice(0, 8)
  const closedPinned = sessionHistory.filter(h => h.pinned).slice(0, 8 - pinnedNodes.length)
  
  const actualItems = [...pinnedNodes, ...closedPinned.map(h => ({ ...h, isClosed: true }))]
  const itemCount = actualItems.length

  // First row shown only when any tab is pinned
  if (itemCount === 0) return null

  // 2nd row shown only if 1st row is filled (4 slots)
  const numSlots = itemCount >= 4 ? 8 : 4
  const slots = [...actualItems]
  while (slots.length < numSlots) slots.push(null)

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
      padding: '12px 12px 8px', background: 'var(--s1)', borderBottom: '1px solid var(--bd)'
    }}>
      {slots.map((slot, i) => {
        const title = slot ? (slot.data?.title || slot.title || 'Untitled') : 'Empty slot'
        const favicon = slot ? (slot.data?.favicon || slot.favicon) : null
        const isClosed = slot?.isClosed
        
        return (
          <div key={i}
            onClick={() => {
              if (!slot) { setComposerOpen(true); return }
              if (isClosed) restoreFromHistory(slot)
              else onFly(slot.id)
            }}
            title={title}
            style={{
              aspectRatio: '1', borderRadius: 10, border: '1px solid var(--bd)',
              background: slot ? 'var(--s2)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 120ms',
              position: 'relative', overflow: 'hidden'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--a)'; e.currentTarget.style.background = slot ? 'var(--s3)' : 'var(--s2)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd)'; e.currentTarget.style.background = slot ? 'var(--s2)' : 'transparent' }}
          >
            {slot ? (
              <>
                {favicon ? (
                  <img src={favicon} style={{ width: 18, height: 18, borderRadius: 4, opacity: isClosed ? 0.4 : 1 }} onError={e => e.target.style.display='none'}/>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: isClosed ? 0.4 : 1 }}>
                    <circle cx="8" cy="8" r="6" stroke="var(--t4)" strokeWidth="1.2"/>
                    <path d="M2 8h12M8 2c-2 2-2 8 0 12M8 2c2 2 2 8 0 12" stroke="var(--t4)" strokeWidth="1.2"/>
                  </svg>
                )}
                {isClosed && (
                  <div style={{ position: 'absolute', bottom: 3, right: 3, width: 6, height: 6, borderRadius: '50%', background: 'var(--a)', border: '1.5px solid var(--s1)' }} />
                )}
              </>
            ) : (
              <div style={{ color: 'var(--t5)', fontSize: 10, fontWeight: 700 }}>+</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function TabRow({ node, onFly, accent }) {
  const { togglePin } = useWorkspaceStore()
  return (
    <div onClick={() => onFly(node.id)}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px 5px 28px', borderRadius: 8, cursor: 'pointer', transition: 'background 120ms' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--s2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      {node.data?.favicon
        ? <img src={node.data.favicon} style={{ width: 14, height: 14, borderRadius: 4, flexShrink: 0 }} onError={e => e.target.style.display='none'}/>
        : <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="8" cy="8" r="6" stroke={accent || 'var(--t4)'} strokeWidth="1.3"/>
            <path d="M2 8h12M8 2c-2 2-2 8 0 12M8 2c2 2 2 8 0 12" stroke={accent || 'var(--t4)'} strokeWidth="1.3"/>
          </svg>
      }
      <span style={{ flex: 1, fontSize: 12, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.data?.title || 'Untitled'}</span>
      <button data-pinned={node.data?.pinned ? 'true' : 'false'} onClick={e => { e.stopPropagation(); togglePin(node.id) }} title={node.data?.pinned ? 'Unpin' : 'Pin'}
        style={{ width: 16, height: 16, border: 'none', background: 'none', cursor: 'pointer', color: node.data?.pinned ? 'var(--a)' : 'var(--t4)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, transition: 'color 120ms', opacity: node.data?.pinned ? 1 : 0, fontFamily: 'inherit' }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--a)' }}
        onMouseLeave={e => { if (!node.data?.pinned) e.currentTarget.style.opacity = '0' }}>
        <svg width="10" height="10" viewBox="0 0 12 12" fill={node.data?.pinned ? 'currentColor' : 'none'}>
          <path d="M5 1L7 1L7 6L10 9L2 9L5 6Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          <path d="M6 9V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}


