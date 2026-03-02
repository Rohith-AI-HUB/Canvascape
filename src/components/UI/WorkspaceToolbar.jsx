// WorkspaceToolbar — rendered INSIDE ReactFlowProvider by CanvasWorkspace.
// useReactFlow() is safe here.
import { motion } from 'framer-motion'
import { useReactFlow } from 'reactflow'
import { useWorkspaceStore } from '../../store/workspaceStore'

const FILTERS = [
  { key: 'all',   label: 'All'    },
  { key: 'week',  label: '7 Days' },
  { key: 'today', label: 'Today'  },
]

const pill = {
  display: 'flex', alignItems: 'center', gap: 2,
  padding: 3,
  background: 'rgba(20,20,23,0.85)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderRadius: 11,
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
}

export default function WorkspaceToolbar() {
  const { filter, setFilter, nodes } = useWorkspaceStore()
  const rf = useReactFlow()
  const count = nodes.filter(n => n.type === 'webNode').length

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.22 }}
      style={{
        position: 'absolute', top: 14, right: 14,
        display: 'flex', alignItems: 'center', gap: 8,
        zIndex: 50, pointerEvents: 'all',
      }}
    >
      {/* Filter pills */}
      <div style={pill}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              background: filter === f.key ? 'rgba(139,92,246,0.2)' : 'transparent',
              color: filter === f.key ? '#C4B5FD' : '#3A3750',
              border: filter === f.key ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Zoom + fit */}
      <div style={pill}>
        <TBtn title="Zoom in"  onClick={() => rf.zoomIn({ duration: 160 })}>
          <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </TBtn>
        <TBtn title="Zoom out" onClick={() => rf.zoomOut({ duration: 160 })}>
          <path d="M4 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </TBtn>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)', margin: '0 2px' }}/>
        <TBtn title="Fit all cards" onClick={() => rf.fitView({ padding: 0.15, duration: 450 })}>
          <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </TBtn>
      </div>

      {/* Card count */}
      {count > 0 && (
        <div style={{
          ...pill, padding: '5px 12px',
          fontSize: 12, color: '#3A3750', fontWeight: 500,
          gap: 0,
        }}>
          {count} card{count !== 1 ? 's' : ''}
        </div>
      )}
    </motion.div>
  )
}

function TBtn({ onClick, title, children }) {
  return (
    <button
      onClick={onClick} title={title}
      style={{
        width: 30, height: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 8, border: 'none', cursor: 'pointer',
        background: 'transparent', color: '#3A3750',
        transition: 'all 0.15s', fontFamily: 'inherit',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; e.currentTarget.style.color = '#A78BFA' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3A3750' }}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">{children}</svg>
    </button>
  )
}
