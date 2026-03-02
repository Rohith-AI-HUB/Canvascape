import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWorkspaceStore } from './store/workspaceStore'
import CanvasWorkspace from './components/Canvas/CanvasWorkspace'
import CanvasSidebar   from './components/Sidebar/CanvasSidebar'
import BottomBar       from './components/UI/BottomBar'
import LoadingScreen   from './components/UI/LoadingScreen'

export default function App() {
  const { isLoading, loadWorkspace, isSidebarOpen } = useWorkspaceStore()

  // Bootstrap
  useEffect(() => { loadWorkspace() }, [])

  // Global keyboard shortcuts
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
    <div className="w-full h-full overflow-hidden" style={{ background: '#F5F0EB', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Loading splash */}
      <AnimatePresence>
        {isLoading && (
          <motion.div key="splash" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0 z-[9999]">
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* App shell — only mount once loaded */}
      {!isLoading && (
        <div style={{ display: 'flex', width: '100%', height: '100%', flexDirection: 'column' }}>

          {/* Windows custom titlebar */}
          <WinTitleBar />

          {/* Main row: sidebar + canvas */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

            {/* Sidebar — animates width */}
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

            {/* Canvas — fills remaining space */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {/*
                CanvasWorkspace wraps ReactFlowProvider internally.
                WorkspaceToolbar lives INSIDE CanvasWorkspace so useReactFlow() works.
              */}
              <CanvasWorkspace />
            </div>
          </div>

          {/* Bottom bar — OUTSIDE ReactFlowProvider. No useReactFlow() calls here.
              Fit-view uses a custom event to bridge into the provider. */}
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
      className="titlebar-drag flex-shrink-0 flex items-center px-4 gap-2"
      style={{ height: 40, background: 'rgba(245,240,235,0.97)', borderBottom: '1px solid rgba(200,189,219,0.2)', zIndex: 50 }}
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <path d="M3 10 Q7 4 10 10 Q13 16 17 10" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <circle cx="10" cy="10" r="2" fill="#A78BFA" opacity="0.5"/>
      </svg>
      <span className="titlebar-no-drag text-xs font-semibold select-none" style={{ color: '#C8BDDB', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Canvascape
      </span>
    </div>
  )
}
