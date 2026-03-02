import { useState, useEffect, useRef } from 'react'
import { motion, LayoutGroup } from 'framer-motion'
import { useReactFlow, useViewport } from 'reactflow'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { AIIcon } from '../AI/AIPanel'

const FILTERS = [
  { key: 'all',   label: 'All'    },
  { key: 'week',  label: '7 days' },
  { key: 'today', label: 'Today'  },
]

export default function TopBar() {
  const { filter, setFilter, nodes, theme, isSidebarOpen, toggleSidebar, addAICanvasNode, setSettingsOpen } = useWorkspaceStore()
  const rf        = useReactFlow()
  const { zoom }  = useViewport()
  const count     = nodes.filter(n => n.type === 'webNode').length
  const isDark    = theme === 'dark'
  const zoomPct   = Math.round(zoom * 100)

  const [hoveredBtn, setHoveredBtn] = useState(null)

  const barBg = isDark ? 'rgba(14,13,10,0.92)' : 'rgba(250,248,242,0.92)'
  const barBorder = isDark ? 'rgba(255,245,220,0.08)' : 'rgba(100,80,40,0.12)'

  const pillStyle = {
    display: 'flex', alignItems: 'center', gap: 2, padding: 3,
    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    borderRadius: 11,
    border: `1px solid ${isDark ? 'rgba(255,245,220,0.06)' : 'rgba(100,80,40,0.08)'}`,
  }

  // Opens a fresh AI chat node centred in the visible canvas area.
  const openAIOnCanvas = () => {
    const nodeW = 360
    const nodeH = 520
    const canvasEl = document.querySelector('.react-flow')
    const cw = canvasEl?.clientWidth ?? window.innerWidth
    const ch = canvasEl?.clientHeight ?? window.innerHeight
    const vp = rf.getViewport()

    let x = (cw / 2 - vp.x) / vp.zoom - nodeW / 2
    let y = (ch / 2 - vp.y) / vp.zoom - nodeH / 2

    addAICanvasNode({ position: { x, y } })
  }

  return (
    <div style={{
      height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 14px', background: barBg, borderBottom: `1px solid ${barBorder}`,
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 1000,
    }}>
      {/* Left: Sidebar Toggle + Branding + AI Chat */}
      <LayoutGroup id="topbar-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} onMouseLeave={() => setHoveredBtn(null)}>
          <TBtn 
            onClick={toggleSidebar} 
            title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            hovered={hoveredBtn === 'sb'}
            onMouseEnter={() => setHoveredBtn('sb')}
          >
            <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M6 3v10" stroke="currentColor" strokeWidth="1.4"/>
          </TBtn>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 4 }}>
            <LogoMark onClick={() => setSettingsOpen(true)} />
            <span style={{
              fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700,
              color: 'var(--t1)', letterSpacing: '-0.03em',
            }}>
              Canvas<span style={{ color: 'var(--a)' }}>scape</span>
            </span>
          </div>

          <div style={{ width: 1, height: 16, background: isDark ? 'rgba(255,245,220,0.08)' : 'rgba(100,80,40,0.12)', margin: '0 2px' }}/>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openAIOnCanvas}
            style={{
              position: 'relative',
              display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px 5px 8px',
              borderRadius: 10, border: `1px solid ${isDark ? 'rgba(255,245,220,0.08)' : 'rgba(100,80,40,0.12)'}`,
              background: 'transparent',
              color: hoveredBtn === 'ai' ? 'var(--a)' : 'var(--t2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'color 160ms',
            }}
            onMouseEnter={() => setHoveredBtn('ai')}
          >
            {hoveredBtn === 'ai' && (
              <motion.div
                layoutId="left-btn-hover"
                style={{ position: 'absolute', inset: 0, borderRadius: 10, background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(217,119,6,0.06)', border: '1px solid var(--bd-a)', zIndex: -1 }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span style={{ position: 'relative', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{
                position: 'absolute', inset: -2, borderRadius: '50%',
                border: '1.5px solid var(--a)', opacity: 0.25,
                animation: 'ai-ring-pulse 2.4s ease-in-out infinite',
                pointerEvents: 'none',
              }}/>
              <AIIcon size={14} color="var(--a)" glow/>
              <style>{`@keyframes ai-ring-pulse { 0%,100%{transform:scale(1);opacity:.25} 50%{transform:scale(1.35);opacity:0} }`}</style>
            </span>
            AI Chat
          </motion.button>
        </div>
      </LayoutGroup>

      {/* Center: Filters */}
      <div style={pillStyle}>
        <LayoutGroup id="topbar-filters">
          {FILTERS.map(f => {
            const isActive = filter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  position: 'relative',
                  padding: '4px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 600,
                  background: 'transparent',
                  color: isActive ? 'var(--a)' : 'var(--t3)',
                  border: '1px solid transparent',
                  cursor: 'pointer', transition: 'color 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    style={{
                      position: 'absolute', inset: 0, borderRadius: 8,
                      background: 'var(--a-bg)', border: '1px solid var(--bd-a)',
                      zIndex: -1
                    }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{f.label}</span>
              </button>
            )
          })}
        </LayoutGroup>
      </div>

      {/* Right: Zoom + Count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={pillStyle}>
          <TBtn title="Zoom in"  onClick={() => rf.zoomIn({ duration: 160 })}>
            <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </TBtn>
          <ZoomLevel pct={zoomPct} isDark={isDark} onReset={() => rf.zoomTo(1, { duration: 220 })} />
          <TBtn title="Zoom out" onClick={() => rf.zoomOut({ duration: 160 })}>
            <path d="M4 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </TBtn>
          <div style={{ width: 1, height: 16, background: isDark ? 'rgba(255,245,220,0.08)' : 'rgba(100,80,40,0.12)', margin: '0 2px' }}/>
          <TBtn title="Fit all tabs in view" onClick={() => rf.fitView({ padding: 0.15, duration: 450 })}>
            <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </TBtn>
        </div>

        {count > 0 && (
          <div style={{
            ...pillStyle, padding: '5px 12px', fontSize: 11.5, color: 'var(--t3)', fontWeight: 500, gap: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--a)', opacity: 0.7 }}/>
            {count} tab{count !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}

function TBtn({ onClick, title, hovered, onMouseEnter, children }) {
  const { theme } = useWorkspaceStore()
  const isDark = theme === 'dark'
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={title}
      onMouseEnter={onMouseEnter}
      style={{
        position: 'relative',
        width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 7, border: 'none', cursor: 'pointer',
        background: 'transparent', color: hovered ? 'var(--a)' : 'var(--t3)',
        transition: 'color 0.2s',
      }}
    >
      {hovered && (
        <motion.div
          layoutId="left-btn-hover"
          style={{ position: 'absolute', inset: 0, borderRadius: 7, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', zIndex: -1 }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        />
      )}
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">{children}</svg>
    </motion.button>
  )
}

function LogoMark({ onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--a-bg)', border: '1px solid var(--bd-a)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: onClick ? 'pointer' : 'default' }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="5" height="5" rx="1.5" stroke="var(--a)" strokeWidth="1.4"/>
        <rect x="9" y="2" width="5" height="5" rx="1.5" stroke="var(--a)" strokeWidth="1.4" opacity="0.5"/>
        <rect x="2" y="9" width="5" height="5" rx="1.5" stroke="var(--a)" strokeWidth="1.4" opacity="0.5"/>
        <rect x="9" y="9" width="5" height="5" rx="1.5" stroke="var(--a)" strokeWidth="1.4" opacity="0.25"/>
      </svg>
    </motion.div>
  )
}

function ZoomLevel({ pct, isDark, onReset }) {
  const isAt100 = pct === 100
  return (
    <button
      onClick={onReset}
      title={isAt100 ? 'Already at 100%' : 'Reset zoom to 100%'}
      style={{
        minWidth: 40, height: 28, padding: '0 4px', borderRadius: 7, border: 'none',
        cursor: isAt100 ? 'default' : 'pointer', background: 'transparent',
        color: isAt100 ? 'var(--t4)' : 'var(--t2)', fontSize: 11, fontWeight: 600,
        fontFamily: "'DM Mono', monospace", display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onMouseEnter={e => { if (!isAt100) { e.currentTarget.style.background = 'var(--s3)'; e.currentTarget.style.color = 'var(--a)' } }}
      onMouseLeave={e => { if (!isAt100) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t2)' } }}
    >
      {pct}%
    </button>
  )
}
