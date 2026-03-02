import { memo } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { motion } from 'framer-motion'

const SettingsNode = memo(function SettingsNode({ id, data, selected }) {
  const { removeNode, theme, toggleTheme, aiProvider, setAIProvider } = useWorkspaceStore()
  const isDark = theme === 'dark'

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'var(--s1)',
      border: `1.5px solid ${selected ? 'var(--a)' : 'var(--bd)'}`,
      borderRadius: 24,
      boxShadow: selected ? '0 12px 48px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header / Drag Handle */}
      <div className="node-drag-handle" style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--bd)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'grab',
        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57', cursor: 'pointer' }} onClick={() => removeNode(id)} />
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--t1)', fontFamily: "'Syne', sans-serif" }}>Settings</h2>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }} className="nodrag">
        
        {/* Appearance Section */}
        <section>
          <h3 style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--t3)', letterSpacing: '0.05em', marginBottom: 12 }}>Appearance</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--s2)', borderRadius: 16, border: '1px solid var(--bd)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Dark Mode</span>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>Toggle between light and dark themes</span>
            </div>
            <button
              onClick={toggleTheme}
              style={{
                width: 40, height: 22, borderRadius: 11,
                background: isDark ? 'var(--a)' : 'var(--s3)',
                border: 'none', cursor: 'pointer', position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <motion.div
                animate={{ x: isDark ? 20 : 2 }}
                style={{
                  width: 18, height: 18, borderRadius: 9,
                  background: '#fff', position: 'absolute', top: 2,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              />
            </button>
          </div>
        </section>

        {/* AI Section */}
        <section>
          <h3 style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--t3)', letterSpacing: '0.05em', marginBottom: 12 }}>AI Provider</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['openai', 'anthropic', 'gemini', 'ollama'].map(provider => (
              <button
                key={provider}
                onClick={() => setAIProvider({ active: provider })}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: aiProvider.active === provider ? 'var(--a-bg)' : 'var(--s2)',
                  borderRadius: 12, border: aiProvider.active === provider ? '1px solid var(--bd-a)' : '1px solid var(--bd)',
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: aiProvider.active === provider ? 'var(--a)' : 'var(--t1)', textTransform: 'capitalize' }}>
                  {provider}
                </span>
                {aiProvider.active === provider && (
                  <span style={{ color: 'var(--a)', fontSize: 12 }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--bd)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.6 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--a-bg)', border: '1px solid var(--bd-a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1.5" stroke="var(--a)" strokeWidth="1.4"/>
                <rect x="9" y="2" width="5" height="5" rx="1.5" stroke="var(--a)" strokeWidth="1.4" opacity="0.5"/>
                <rect x="2" y="9" width="5" height="5" rx="1.5" stroke="var(--a)" strokeWidth="1.4" opacity="0.5"/>
                <rect x="9" y="9" width="5" height="5" rx="1.5" stroke="var(--a)" strokeWidth="1.4" opacity="0.25"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>Canvascape</div>
              <div style={{ fontSize: 10, color: 'var(--t3)' }}>Version 1.0.0</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
})

export default SettingsNode
