import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'

export default function CanvasSidebar() {
  const { nodes, workspaces, activeWorkspaceId, setActiveWorkspaceId, addWebNode, addWorkspace, renameWorkspace, updateWorkspace, removeWorkspace,
    toggleSidebar, setComposerOpen, restoreFromHistory, getActiveWorkspace } = useWorkspaceStore()
  const [expanded, setExpanded] = useState(() => new Set(['__none__']))
  const [addingCat, setAddingCat] = useState(false)
  const [newLabel,  setNewLabel]  = useState('')
  const [editId,    setEditId]    = useState(null)
  const [editLabel, setEditLabel] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const scrollRef = useRef(null)

  const activeWorkspace = getActiveWorkspace()
  const sessionHistory = activeWorkspace?.sessionHistory || []
  const webNodes      = nodes.filter(n => n.type === 'webNode')
  const filteredNodes = webNodes.filter(n => n.data?.workspaceId === activeWorkspaceId || (!activeWorkspaceId && !n.data?.workspaceId))
  
  const flyTo  = id => window.dispatchEvent(new CustomEvent('canvas:flyto', { detail: { nodeId: id } }))
  const toggle = id => setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  const commitAdd  = () => { if (newLabel.trim()) addWorkspace(newLabel.trim()); setAddingCat(false); setNewLabel('') }
  const commitEdit = () => {
    if (editLabel.trim() && editId) {
      updateWorkspace(editId, { label: editLabel.trim() })
    }
    setEditId(null)
  }

  const allWorkspaces = [{ id: null, label: 'Unsorted', color: 'var(--t4)' }, ...workspaces]
  
  const switchWorkspace = (dir) => {
    const idx = allWorkspaces.findIndex(c => c.id === activeWorkspaceId)
    let next = idx + dir
    if (next < 0) next = allWorkspaces.length - 1
    if (next >= allWorkspaces.length) next = 0
    setActiveWorkspaceId(allWorkspaces[next].id)
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
  }, [activeWorkspaceId])

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
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--s1)', borderRight: '1px solid var(--bd)',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* ── Pinned Grid ── */}
      <PinnedGrid nodes={nodes} onFly={flyTo} sessionHistory={sessionHistory} restoreFromHistory={restoreFromHistory} setComposerOpen={setComposerOpen} />

      {/* ── New Tab Button ── */}
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

      {/* ── Active Workspace label ── */}
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
            )}
          </>
        )}
      </div>

      {/* ── Tree (Only nodes of active workspace) ── */}
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

      {/* ── Workspaces Switcher (Moved to bottom) ── */}
      <div style={{ borderTop: '1px solid var(--bd)', padding: '12px 0 8px', background: 'var(--s1)' }}>
        <div style={{ padding: '0 8px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Previous Arrow */}
          <button 
            onClick={() => switchWorkspace(-1)}
            style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--t4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--t2)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--t4)'}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div ref={scrollRef} style={{ flex: 1, overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <LayoutGroup id="sidebar-workspaces">
              {allWorkspaces.map(ws => {
                const isActive = activeWorkspaceId === ws.id
                return (
                <button
                  key={ws.id ?? 'unsorted'}
                  onClick={() => setActiveWorkspaceId(ws.id)}
                  data-active={isActive}
                  style={{
                    position: 'relative', flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                    borderRadius: 10, border: '1px solid transparent',
                    background: 'transparent',
                    color: isActive ? (ws.color || 'var(--a)') : 'var(--t3)',
                    fontSize: 11.5, fontWeight: 700, cursor: 'pointer', transition: 'all 120ms',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--s2)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-workspace-bg"
                      style={{
                        position: 'absolute', inset: 0, borderRadius: 10,
                        background: ws.bg || 'var(--a-bg)',
                        border: `1px solid ${ws.color || 'var(--bd-a)'}`,
                        zIndex: -1
                      }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: ws.color }} />
                  {ws.emoji && <span style={{ fontSize: 12 }}>{ws.emoji}</span>}
                  {ws.label}
                </button>
              )
              })}
            </LayoutGroup>
          </div>

          {/* Next Arrow */}
          <button 
            onClick={() => switchWorkspace(1)}
            style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--t4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--t2)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--t4)'}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div style={{ width: 1, height: 16, background: 'var(--bd)', margin: '0 4px' }} />

          <button
            onClick={() => setAddingCat(true)}
            style={{
              width: 26, height: 26, borderRadius: 13, border: 'none', background: 'var(--a-bg)',
              color: 'var(--a)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {addingCat && (
          <div style={{ padding: '0 12px 8px' }}>
            <input
              autoFocus value={newLabel} onChange={e => setNewLabel(e.target.value)}
              onBlur={commitAdd} onKeyDown={e => e.key === 'Enter' && commitAdd()}
              placeholder="New workspace..."
              style={{
                width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--bd-a)',
                background: 'var(--a-bg)', color: 'var(--t1)', fontSize: 12, outline: 'none'
              }}
            />
          </div>
        )}
      </div>
    </div>
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

function SbBtn({ onClick, title, children }) {
  return (
    <button onClick={onClick} title={title}
      style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 130ms', fontFamily: 'inherit' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--s3)'; e.currentTarget.style.color = 'var(--t2)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t3)' }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">{children}</svg>
    </button>
  )
}
