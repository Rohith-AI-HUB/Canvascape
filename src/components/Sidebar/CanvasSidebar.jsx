// CanvasSidebar — OUTSIDE ReactFlowProvider.
// Uses window events to communicate with the canvas. No useReactFlow() here.
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'

export default function CanvasSidebar() {
  const { nodes, categories, addWebNode, addCategory, renameCategory,
          removeCategory, toggleSidebar, setComposerOpen } = useWorkspaceStore()

  const [expanded, setExpanded]   = useState(() => new Set(['__none__']))
  const [addingCat, setAddingCat] = useState(false)
  const [newLabel, setNewLabel]   = useState('')
  const [editId, setEditId]       = useState(null)
  const [editLabel, setEditLabel] = useState('')

  const webNodes      = nodes.filter(n => n.type === 'webNode')
  const uncategorized = webNodes.filter(n => !n.data?.categoryId)

  const flyTo  = id  => window.dispatchEvent(new CustomEvent('canvas:flyto', { detail: { nodeId: id } }))
  const toggle = id  => setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const commitAdd = () => {
    if (newLabel.trim()) addCategory(newLabel.trim())
    setAddingCat(false); setNewLabel('')
  }
  const commitEdit = () => {
    if (editLabel.trim()) renameCategory(editId, editLabel.trim())
    setEditId(null)
  }

  return (
    <div style={{
      width: 236, height: '100%', display: 'flex', flexDirection: 'column',
      background: '#0E0E12', borderRight: '1px solid rgba(255,255,255,0.055)',
      fontFamily: 'inherit', userSelect: 'none', overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px', height: 50,
        borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M3 10 Q7 4 10 10 Q13 16 17 10" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <circle cx="10" cy="10" r="2" fill="#8B5CF6" opacity="0.65"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#E8E6F0', letterSpacing: '0.02em' }}>Canvascape</span>
        </div>
        <IBtn title="Collapse sidebar" onClick={toggleSidebar}>
          <path d="M10 4L5 8l5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </IBtn>
      </div>

      {/* ── New card button ── */}
      <div style={{ padding: '10px 10px 6px' }}>
        <button
          onClick={() => setComposerOpen(true)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 500,
            cursor: 'pointer', border: '1px solid rgba(139,92,246,0.2)',
            background: 'rgba(139,92,246,0.08)', color: '#A78BFA',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(139,92,246,0.16)'
            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'
            e.currentTarget.style.color = '#C4B5FD'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(139,92,246,0.08)'
            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'
            e.currentTarget.style.color = '#A78BFA'
          }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          New Card
          <kbd style={{
            marginLeft: 'auto', fontSize: 10, fontFamily: 'monospace',
            color: '#3A3750', background: 'rgba(255,255,255,0.05)',
            padding: '1px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.06)',
          }}>Ctrl+N</kbd>
        </button>
      </div>

      {/* ── Section label ── */}
      <div style={{ padding: '8px 14px 4px' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#2E2C3A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Spaces
        </span>
      </div>

      {/* ── Tree ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2px 8px 12px', scrollbarWidth: 'thin' }}>

        {uncategorized.length > 0 && (
          <CatRow
            label="Uncategorized" color="#3A3750" count={uncategorized.length}
            expanded={expanded.has('__none__')} onToggle={() => toggle('__none__')}
          >
            {uncategorized.map(n => <CardRow key={n.id} node={n} onFly={flyTo}/>)}
          </CatRow>
        )}

        {categories.map(cat => {
          const catNodes = webNodes.filter(n => n.data?.categoryId === cat.id)
          const pinned   = catNodes.filter(n => n.data?.pinned)
          const rest     = catNodes.filter(n => !n.data?.pinned)
          return (
            <CatRow
              key={cat.id} color={cat.color} count={catNodes.length}
              expanded={expanded.has(cat.id)} onToggle={() => toggle(cat.id)}
              onDelete={() => removeCategory(cat.id)}
              label={
                editId === cat.id
                  ? <input
                      autoFocus value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      onBlur={commitEdit}
                      onClick={e => e.stopPropagation()}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') commitEdit(); e.stopPropagation() }}
                      style={{ flex: 1, outline: 'none', background: 'transparent', fontSize: 12, fontWeight: 500, color: '#E8E6F0', borderBottom: `1px solid ${cat.color}`, fontFamily: 'inherit' }}
                    />
                  : <span
                      onDoubleClick={e => { e.stopPropagation(); setEditId(cat.id); setEditLabel(cat.label) }}
                      style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#9C99AC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >{cat.label}</span>
              }
            >
              {pinned.map(n  => <CardRow key={n.id} node={n} onFly={flyTo} accent={cat.color}/>)}
              {pinned.length > 0 && rest.length > 0 && (
                <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '2px 8px' }}/>
              )}
              {rest.map(n => <CardRow key={n.id} node={n} onFly={flyTo} accent={cat.color}/>)}
              <button
                onClick={() => addWebNode({ categoryId: cat.id })}
                style={{ width: '100%', textAlign: 'left', padding: '4px 8px 4px 28px', fontSize: 11.5, color: '#2E2C3A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 6 }}
                onMouseEnter={e => { e.currentTarget.style.color = cat.color; e.currentTarget.style.background = 'rgba(139,92,246,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#2E2C3A'; e.currentTarget.style.background = 'none' }}
              >
                + Add card
              </button>
            </CatRow>
          )
        })}

        {addingCat
          ? <input
              autoFocus value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onBlur={commitAdd}
              onKeyDown={e => {
                if (e.key === 'Enter') commitAdd()
                if (e.key === 'Escape') { setAddingCat(false); setNewLabel('') }
                e.stopPropagation()
              }}
              placeholder="Category name..."
              style={{ width: '100%', padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(139,92,246,0.35)', outline: 'none', fontSize: 12, color: '#E8E6F0', background: 'rgba(139,92,246,0.08)', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          : <button
              onClick={() => setAddingCat(true)}
              style={{ width: '100%', textAlign: 'left', padding: '5px 8px', fontSize: 12, color: '#2E2C3A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 6 }}
              onMouseEnter={e => { e.currentTarget.style.color = '#6B6880'; e.currentTarget.style.background = 'rgba(139,92,246,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#2E2C3A'; e.currentTarget.style.background = 'none' }}
            >
              + New space
            </button>
        }
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: '#2E2C3A' }}>{webNodes.length} card{webNodes.length !== 1 ? 's' : ''}</span>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399' }}/>
      </div>
    </div>
  )
}

/* ─── Category Row ─────────────────────────────────────────────────────────── */
function CatRow({ label, color, count, expanded, onToggle, onDelete, children }) {
  return (
    <div style={{ marginBottom: 2 }}>
      <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px', borderRadius: 7, cursor: 'pointer', transition: 'background 0.12s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <motion.svg
          animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.13 }}
          width="9" height="9" viewBox="0 0 10 10" fill="none"
          style={{ flexShrink: 0, color: '#2E2C3A' }}
        >
          <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </motion.svg>

        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 5px ${color}80` }}/>

        {typeof label === 'string'
          ? <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#9C99AC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
          : label
        }

        <span style={{ fontSize: 11, color: '#2E2C3A', fontVariantNumeric: 'tabular-nums' }}>{count}</span>

        {onDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#2E2C3A', fontSize: 14, lineHeight: 1, borderRadius: 4, fontFamily: 'inherit', opacity: 0, transition: 'opacity 0.1s, color 0.1s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.opacity = 1 }}
            onMouseLeave={e => { e.currentTarget.style.color = '#2E2C3A'; e.currentTarget.style.opacity = 0 }}
          >&times;</button>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.13 }}
            style={{ overflow: 'hidden' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Card Row ──────────────────────────────────────────────────────────────── */
function CardRow({ node, onFly, accent }) {
  const { togglePin } = useWorkspaceStore()
  return (
    <div
      onClick={() => onFly(node.id)}
      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 6px 4px 22px', borderRadius: 6, cursor: 'pointer', transition: 'background 0.12s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {node.data?.favicon
        ? <img src={node.data.favicon} style={{ width: 13, height: 13, borderRadius: 3, flexShrink: 0 }} onError={e => e.target.style.display = 'none'}/>
        : <span style={{ width: 13, height: 13, fontSize: 10, color: accent || '#3A3750', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>○</span>
      }
      <span style={{ flex: 1, fontSize: 12, color: '#5C5970', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {node.data?.title || 'Untitled'}
      </span>
      {node.data?.pinned && <span style={{ fontSize: 10, color: accent || '#8B5CF6' }}>◈</span>}
      <button
        onClick={e => { e.stopPropagation(); togglePin(node.id) }}
        style={{ width: 14, height: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#2E2C3A', fontSize: 10, flexShrink: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, transition: 'color 0.12s' }}
        title={node.data?.pinned ? 'Unpin' : 'Pin'}
        onMouseEnter={e => e.currentTarget.style.color = accent || '#8B5CF6'}
        onMouseLeave={e => e.currentTarget.style.color = '#2E2C3A'}
      >
        {node.data?.pinned ? '◈' : '◇'}
      </button>
    </div>
  )
}

/* ─── Icon Button ───────────────────────────────────────────────────────────── */
function IBtn({ onClick, title, children }) {
  return (
    <button
      onClick={onClick} title={title}
      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: '#3A3750', transition: 'all 0.15s', fontFamily: 'inherit' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; e.currentTarget.style.color = '#A78BFA' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3A3750' }}
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">{children}</svg>
    </button>
  )
}
