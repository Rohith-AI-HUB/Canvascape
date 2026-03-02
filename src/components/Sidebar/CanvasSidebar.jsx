import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'

export default function CanvasSidebar() {
  const { nodes, categories, addWebNode, addCategory, renameCategory, removeCategory,
    toggleSidebar, setComposerOpen, theme, toggleTheme } = useWorkspaceStore()
  const [expanded, setExpanded] = useState(() => new Set(['__none__']))
  const [addingCat, setAddingCat] = useState(false)
  const [newLabel,  setNewLabel]  = useState('')
  const [editId,    setEditId]    = useState(null)
  const [editLabel, setEditLabel] = useState('')
  const isDark = theme === 'dark'

  const webNodes      = nodes.filter(n => n.type === 'webNode')
  const uncategorized = webNodes.filter(n => !n.data?.categoryId)
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
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 54, borderBottom: '1px solid var(--bd)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LogoMark />
          <span style={{
            fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700,
            color: 'var(--t1)', letterSpacing: '-0.03em',
          }}>
            Canvas<span style={{ color: 'var(--a)' }}>scape</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <SbBtn title={isDark ? 'Light mode' : 'Dark mode'} onClick={toggleTheme}>
            {isDark
              ? <path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.6 3.6l1 1M11.4 11.4l1 1M11.4 3.6l-1 1M4.6 11.4l-1 1M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              : <path d="M13.5 9A6 6 0 0 1 7 2.5 5.5 5.5 0 1 0 13.5 9z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
            }
          </SbBtn>
          <SbBtn title="Collapse sidebar (Ctrl+\)" onClick={toggleSidebar}>
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </SbBtn>
        </div>
      </div>

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

      {/* ── Section label ── */}
      <div style={{ padding: '12px 16px 4px', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t3)' }}>
        Workspaces
      </div>

      {/* ── Tree ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 12px', scrollbarWidth: 'thin' }}>
        {uncategorized.length > 0 && (
          <CatSection label="Unsorted" colorDot="var(--t4)"
            count={uncategorized.length} expanded={expanded.has('__none__')}
            onToggle={() => toggle('__none__')}>
            {uncategorized.map(n => <TabRow key={n.id} node={n} onFly={flyTo}/>)}
          </CatSection>
        )}

        {categories.map(cat => {
          const catNodes = webNodes.filter(n => n.data?.categoryId === cat.id)
          return (
            <CatSection key={cat.id} colorDot={cat.color} count={catNodes.length}
              expanded={expanded.has(cat.id)} onToggle={() => toggle(cat.id)}
              onDelete={() => removeCategory(cat.id)}
              label={editId === cat.id
                ? <input autoFocus value={editLabel}
                    onChange={e => setEditLabel(e.target.value)}
                    onBlur={commitEdit} onClick={e => e.stopPropagation()}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') commitEdit(); e.stopPropagation() }}
                    style={{ flex: 1, outline: 'none', background: 'transparent', fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', borderBottom: `1.5px solid ${cat.color}`, fontFamily: 'inherit' }}/>
                : <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    onDoubleClick={e => { e.stopPropagation(); setEditId(cat.id); setEditLabel(cat.label) }}>
                    {cat.label}
                  </span>
              }>
              {catNodes.map(n => <TabRow key={n.id} node={n} onFly={flyTo} accent={cat.color}/>)}
              <button onClick={() => addWebNode({ categoryId: cat.id })}
                style={{ width: '100%', textAlign: 'left', padding: '5px 8px 5px 30px', fontSize: 12, color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 7, transition: 'all 120ms' }}
                onMouseEnter={e => { e.currentTarget.style.color = cat.color; e.currentTarget.style.background = 'var(--s2)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.background = 'none' }}>
                + Add tab here
              </button>
            </CatSection>
          )
        })}

        {addingCat
          ? <input autoFocus value={newLabel} onChange={e => setNewLabel(e.target.value)}
              onBlur={commitAdd}
              onKeyDown={e => { if (e.key === 'Enter') commitAdd(); if (e.key === 'Escape') { setAddingCat(false); setNewLabel('') }; e.stopPropagation() }}
              placeholder="Workspace name…"
              style={{ width: '100%', padding: '7px 12px', borderRadius: 9, border: '1px solid var(--bd-a)', outline: 'none', fontSize: 12.5, color: 'var(--t1)', background: 'var(--a-bg)', fontFamily: 'inherit', boxSizing: 'border-box' }}/>
          : <button onClick={() => setAddingCat(true)}
              style={{ width: '100%', textAlign: 'left', padding: '6px 10px', fontSize: 12, color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 8, transition: 'all 120ms' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--s2)'; e.currentTarget.style.color = 'var(--t2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--t3)' }}>
              + New workspace
            </button>
        }
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: 'var(--t3)' }}>{webNodes.length} tab{webNodes.length !== 1 ? 's' : ''} open</span>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399' }}/>
      </div>
    </div>
  )
}

function CatSection({ label, colorDot, count, expanded, onToggle, onDelete, children }) {
  return (
    <div style={{ marginBottom: 2 }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 9, cursor: 'pointer', transition: 'background 120ms', marginBottom: 1 }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--s2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <motion.svg animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.13 }}
          width="9" height="9" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, color: 'var(--t3)' }}>
          <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </motion.svg>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: colorDot, flexShrink: 0 }}/>
        {typeof label === 'string' ? <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span> : label}
        <span style={{ fontSize: 11, color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
        {onDelete && (
          <button onClick={e => { e.stopPropagation(); onDelete() }}
            style={{ width: 18, height: 18, borderRadius: 5, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'all 120ms', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.opacity = '1' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '0' }}>×</button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.14 }} style={{ overflow: 'hidden' }}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
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

function LogoMark() {
  return (
    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--a-bg)', border: '1px solid var(--bd-a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="5" height="5" rx="1.5" stroke="var(--a)" strokeWidth="1.4"/>
        <rect x="9" y="2" width="5" height="5" rx="1.5" stroke="var(--a)" strokeWidth="1.4" opacity="0.5"/>
        <rect x="2" y="9" width="5" height="5" rx="1.5" stroke="var(--a)" strokeWidth="1.4" opacity="0.5"/>
        <rect x="9" y="9" width="5" height="5" rx="1.5" stroke="var(--a)" strokeWidth="1.4" opacity="0.25"/>
      </svg>
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
