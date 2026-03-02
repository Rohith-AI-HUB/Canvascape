import { motion } from 'framer-motion'
import { useReactFlow } from 'reactflow'
import { useWorkspaceStore } from '../../store/workspaceStore'

const FILTERS = [
  { key: 'all',   label: 'All'    },
  { key: 'week',  label: '7 days' },
  { key: 'today', label: 'Today'  },
]

export default function WorkspaceToolbar() {
  const { filter, setFilter, nodes, theme } = useWorkspaceStore()
  const rf    = useReactFlow()
  const count = nodes.filter(n => n.type === 'webNode').length
  const isDark = theme === 'dark'

  const pillStyle = {
    display: 'flex', alignItems: 'center', gap: 2, padding: 3,
    background: isDark ? 'rgba(14,13,10,0.9)' : 'rgba(250,248,242,0.95)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 11,
    border: `1px solid ${isDark ? 'rgba(255,245,220,0.08)' : 'rgba(100,80,40,0.12)'}`,
    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.08)',
  }

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.22 }}
      style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 7, zIndex: 50 }}>

      {/* Filter pills */}
      <div style={pillStyle}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{
              padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
              background: filter === f.key ? 'var(--a-bg)' : 'transparent',
              color: filter === f.key ? 'var(--a)' : 'var(--t3)',
              border: filter === f.key ? '1px solid var(--bd-a)' : '1px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Zoom + fit */}
      <div style={pillStyle}>
        <TBtn title="Zoom in"  onClick={() => rf.zoomIn({ duration: 160 })}>
          <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </TBtn>
        <TBtn title="Zoom out" onClick={() => rf.zoomOut({ duration: 160 })}>
          <path d="M4 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </TBtn>
        <div style={{ width: 1, height: 16, background: isDark ? 'rgba(255,245,220,0.08)' : 'rgba(100,80,40,0.12)', margin: '0 2px' }}/>
        <TBtn title="Fit all" onClick={() => rf.fitView({ padding: 0.15, duration: 450 })}>
          <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </TBtn>
      </div>

      {/* Count badge */}
      {count > 0 && (
        <div style={{ ...pillStyle, padding: '5px 12px', fontSize: 12, color: 'var(--t3)', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--a)', opacity: 0.7, display: 'inline-block' }}/>
          {count} tab{count !== 1 ? 's' : ''}
        </div>
      )}
    </motion.div>
  )
}

function TBtn({ onClick, title, children }) {
  return (
    <button onClick={onClick} title={title}
      style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--t3)', transition: 'all 0.15s', fontFamily: 'inherit' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--s3)'; e.currentTarget.style.color = 'var(--a)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t3)' }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">{children}</svg>
    </button>
  )
}
