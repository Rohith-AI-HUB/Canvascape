import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWorkspaceStore } from './store/workspaceStore'
import CanvasWorkspace from './components/Canvas/CanvasWorkspace'
import CanvasSidebar   from './components/Sidebar/CanvasSidebar'
import BottomBar       from './components/UI/BottomBar'
import LoadingScreen   from './components/UI/LoadingScreen'

export default function App() {
  const { isLoading, loadWorkspace, isSidebarOpen, theme } = useWorkspaceStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

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
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: 'var(--bg)', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <AnimatePresence>
        {isLoading && (
          <motion.div key="splash" initial={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }} style={{ position: 'absolute', inset: 0, zIndex: 9999 }}>
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
                <motion.div key="sb"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 260, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
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
  const { theme } = useWorkspaceStore()
  const isWin = typeof window !== 'undefined' && window.canvascape?.platform === 'win32'
  if (!isWin) return null
  return (
    <div className="titlebar-drag" style={{
      height: 38, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10,
      background: 'var(--s1)', borderBottom: '1px solid var(--bd)', zIndex: 50,
    }}>
      <div className="titlebar-no-drag" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--a-bg)', border: '1px solid var(--bd-a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M2 8 Q5 3 8 8 Q11 13 14 8" stroke="var(--a)" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--t2)', letterSpacing: '-0.02em' }}>Canvas<span style={{ color: 'var(--a)' }}>scape</span></span>
      </div>
    </div>
  )
}
