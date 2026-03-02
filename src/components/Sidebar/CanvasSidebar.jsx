import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'

export default function CanvasSidebar() {
  const { nodes, categories, activeCategoryId, addWebNode, addCategory, renameCategory, removeCategory,
    toggleSidebar, setComposerOpen, sessionHistory, restoreFromHistory } = useWorkspaceStore()
  const [expanded, setExpanded] = useState(() => new Set(['__none__']))
  const [addingCat, setAddingCat] = useState(false)
  const [newLabel,  setNewLabel]  = useState('')
  const [editId,    setEditId]    = useState(null)
  const [editLabel, setEditLabel] = useState('')

  const activeCategory = categories.find(c => c.id === activeCategoryId)
  const webNodes      = nodes.filter(n => n.type === 'webNode')
  const filteredNodes = webNodes.filter(n => n.data?.categoryId === activeCategoryId || (!activeCategoryId && !n.data?.categoryId))
  
  const flyTo  = id => window.dispatchEvent(new CustomEvent('canvas:flyto', { detail: { nodeId: id } }))
  const toggle = id => setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  const commitAdd  = () => { if (newLabel.trim()) addCategory(newLabel.trim()); setAddingCat(false); setNewLabel('') }
  const commitEdit = () => { if (editLabel.trim()) renameCategory(editId, editLabel.trim()); setEditId(null) }

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
      <div style={{ padding: '12px 16px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: activeCategory?.color || 'var(--t4)' }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--t2)' }}>
          {activeCategory?.label || 'Unsorted'}
        </span>
      </div>

      {/* ── Tree (Only nodes of active workspace) ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 12px', scrollbarWidth: 'thin' }}>
        {filteredNodes.length > 0 ? (
          filteredNodes.map(n => <TabRow key={n.id} node={n} onFly={flyTo} accent={activeCategory?.color}/>)
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
    </div>
  )
}

function PinnedGrid({ nodes, onFly, sessionHistory, restoreFromHistory, setComposerOpen }) {
  const pinnedNodes = nodes.filter(n => n.data?.pinned).slice(0, 8)
  const closedPinned = sessionHistory.filter(h => h.pinned).slice(0, 8 - pinnedNodes.length)
  
  const slots = [...pinnedNodes, ...closedPinned.map(h => ({ ...h, isClosed: true }))]
  while (slots.length < 8) slots.push(null)

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
