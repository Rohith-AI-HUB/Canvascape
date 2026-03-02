import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWorkspaceStore } from './store/workspaceStore'
import CanvasWorkspace from './components/Canvas/CanvasWorkspace'
import CanvasSidebar   from './components/Sidebar/CanvasSidebar'
import BottomBar       from './components/UI/BottomBar'
import LoadingScreen   from './components/UI/LoadingScreen'

export default function App() {
  const { isLoading, loadWorkspace, isSidebarOpen } = useWorkspaceStore()

  useEffect(() => { loadWorkspace() }, [])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        useWorkspaceStore.getState().setComposerOpen(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        useWorkspaceStore.getState().toggleSidebar()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="w-full h-full overflow-hidden" style={{ background: '#0E0E12', fontFamily: "'Inter', system-ui, sans-serif" }}>

      <AnimatePresence>
        {isLoading && (
          <motion.div key="splash" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0 z-[9999]">
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && (
        <div style={{ display: 'flex', width: '100%', height: '100%', flexDirection: 'column' }}>

          <WinTitleBar />

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <AnimatePresence initial={false}>
              {isSidebarOpen && (
                <motion.div
                  key="sidebar"
                  initial={{ width: 0 }}
                  animate={{ width: 236 }}
                  exit={{ width: 0 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: 'hidden', flexShrink: 0, height: '100%' }}
                >
                  <CanvasSidebar />
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <CanvasWorkspace />
            </div>
          </div>

          <BottomBar />
        </div>
      )}
    </div>
  )
}

function WinTitleBar() {
  const isWin = typeof window !== 'undefined' && window.canvascape?.platform === 'win32'
  if (!isWin) return null

  return (
    <div
      className="titlebar-drag flex-shrink-0 flex items-center px-4 gap-3"
      style={{
        height: 38,
        background: '#0A0A0D',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        zIndex: 50,
      }}
    >
      {/* Logo mark */}
      <svg width="15" height="15" viewBox="0 0 20 20" fill="none" className="titlebar-no-drag" style={{ flexShrink: 0 }}>
        <path d="M3 10 Q7 4 10 10 Q13 16 17 10" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <circle cx="10" cy="10" r="1.8" fill="#8B5CF6" opacity="0.7"/>
      </svg>

      {/* App name */}
      <span className="titlebar-no-drag text-xs font-semibold select-none" style={{ color: '#2E2C3A', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 10.5 }}>
        Canvascape
      </span>

      {/* Subtle center drag hint line */}
      <div style={{ flex: 1, height: 1 }}/>

      {/* Optional version badge */}
      <span className="titlebar-no-drag" style={{ fontSize: 10, color: '#1E1C28', letterSpacing: '0.06em', fontFamily: 'monospace' }}>v0.1</span>
    </div>
  )
}
