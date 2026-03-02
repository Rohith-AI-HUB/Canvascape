import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ReactFlowProvider } from 'reactflow'
import { useWorkspaceStore } from './store/workspaceStore'
import CanvasWorkspace from './components/Canvas/CanvasWorkspace'
import CanvasSidebar   from './components/Sidebar/CanvasSidebar'
import TopBar          from './components/UI/TopBar'
import ComposerModal   from './components/UI/ComposerModal'
import LoadingScreen   from './components/UI/LoadingScreen'
import CommandPalette  from './components/UI/CommandPalette'

export default function App() {
  const { isLoading, loadWorkspace, isSidebarOpen, theme } = useWorkspaceStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => { loadWorkspace() }, [])

  useEffect(() => {
    const onKey = (e) => {
      const { setComposerOpen, toggleSidebar, setCommandOpen } = useWorkspaceStore.getState()
      // Ctrl+N — open composer
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        setComposerOpen(true)
      }
      // Ctrl+\ — toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        toggleSidebar()
      }
      // Ctrl+K — command palette (handled in CommandPalette too, but guard here for safety)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen(true)
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
        <ReactFlowProvider>
          <div style={{ display: 'flex', width: '100%', height: '100%', flexDirection: 'column' }}>
            <TopBar />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <AnimatePresence initial={false}>
              {isSidebarOpen && (
                <motion.div key="sb"
                  initial={{ width: 0, x: -20, opacity: 0 }}
                  animate={{ width: 260, x: 0, opacity: 1 }}
                  exit={{ width: 0, x: -20, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
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
          </div>
        </ReactFlowProvider>
      )}

      {/* Global overlays */}
      <ComposerModal />
      <CommandPalette />
    </div>
  )
}
