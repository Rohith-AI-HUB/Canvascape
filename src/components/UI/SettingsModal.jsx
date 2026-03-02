import { AnimatePresence, motion } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'

export default function SettingsModal() {
  const { isSettingsOpen, setSettingsOpen, theme, toggleTheme, aiProvider, setAIProvider } = useWorkspaceStore()
  const isDark = theme === 'dark'

  if (!isSettingsOpen) return null

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSettingsOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 400,
              background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)',
              backdropFilter: 'blur(8px)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 401, width: 'min(500px, 90vw)',
              background: 'var(--s1)',
              border: '1px solid var(--bd)',
              borderRadius: 24,
              boxShadow: '0 32px 64px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              maxHeight: '80vh',
            }}
          >
            {/* Header */}
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--t1)', fontFamily: "'Syne', sans-serif" }}>Settings</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                style={{
                  background: 'var(--s2)', border: '1px solid var(--bd)',
                  borderRadius: 10, width: 32, height: 32, cursor: 'pointer',
                  color: 'var(--t3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Appearance Section */}
              <section>
                <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--t3)', letterSpacing: '0.05em', marginBottom: 12 }}>Appearance</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--s2)', borderRadius: 16, border: '1px solid var(--bd)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Dark Mode</span>
                    <span style={{ fontSize: 12, color: 'var(--t3)' }}>Toggle between light and dark themes</span>
                  </div>
                  <button
                    onClick={toggleTheme}
                    style={{
                      width: 44, height: 24, borderRadius: 12,
                      background: isDark ? 'var(--a)' : 'var(--s3)',
                      border: 'none', cursor: 'pointer', position: 'relative',
                      transition: 'background 0.2s',
                    }}
                  >
                    <motion.div
                      animate={{ x: isDark ? 22 : 2 }}
                      style={{
                        width: 20, height: 20, borderRadius: 10,
                        background: '#fff', position: 'absolute', top: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    />
                  </button>
                </div>
              </section>

              {/* AI Section */}
              <section>
                <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--t3)', letterSpacing: '0.05em', marginBottom: 12 }}>AI Provider</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {['openai', 'anthropic', 'gemini', 'ollama'].map(provider => (
                    <button
                      key={provider}
                      onClick={() => setAIProvider({ active: provider })}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', background: aiProvider.active === provider ? 'var(--a-bg)' : 'var(--s2)',
                        borderRadius: 16, border: aiProvider.active === provider ? '1px solid var(--bd-a)' : '1px solid var(--bd)',
                        cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600, color: aiProvider.active === provider ? 'var(--a)' : 'var(--t1)', textTransform: 'capitalize' }}>
                        {provider}
                      </span>
                      {aiProvider.active === provider && (
                        <span style={{ color: 'var(--a)', fontSize: 14 }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </section>

              {/* About Section */}
              <section style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--bd)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--a-bg)', border: '1px solid var(--bd-a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="2" width="5" height="5" rx="1.5" stroke="var(--a)" strokeWidth="1.4"/>
                      <rect x="9" y="2" width="5" height="5" rx="1.5" stroke="var(--a)" strokeWidth="1.4" opacity="0.5"/>
                      <rect x="2" y="9" width="5" height="5" rx="1.5" stroke="var(--a)" strokeWidth="1.4" opacity="0.5"/>
                      <rect x="9" y="9" width="5" height="5" rx="1.5" stroke="var(--a)" strokeWidth="1.4" opacity="0.25"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Canvascape</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>Version 1.0.0</div>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
