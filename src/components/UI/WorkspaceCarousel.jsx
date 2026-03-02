import { useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'

export default function WorkspaceCarousel() {
  const { categories, activeCategoryId, setActiveCategoryId, addCategory, theme } = useWorkspaceStore()
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const isDark = theme === 'dark'

  const commitAdd = () => {
    if (newLabel.trim()) {
      addCategory(newLabel.trim())
    }
    setAdding(false)
    setNewLabel('')
  }

  return (
    <div style={{
      position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
      background: isDark ? 'rgba(14,13,10,0.85)' : 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(20px)', border: `1px solid ${isDark ? 'rgba(255,245,220,0.08)' : 'rgba(100,80,40,0.1)'}`,
      borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: 1000,
      maxWidth: 'min(800px, 90vw)', overflowX: 'auto', scrollbarWidth: 'none'
    }}>
      {/* Categories */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <LayoutGroup id="carousel-cats">
          {[{ id: null, label: 'Unsorted', color: 'var(--t4)' }, ...categories].map(cat => {
            const isActive = activeCategoryId === cat.id
            return (
              <button
                key={cat.id ?? 'unsorted'}
                onClick={() => setActiveCategoryId(cat.id)}
                style={{
                  position: 'relative',
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
                  borderRadius: 14, border: '1px solid transparent',
                  background: 'transparent',
                  color: isActive ? (cat.color || 'var(--a)') : 'var(--t3)',
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-cat-pill"
                    style={{
                      position: 'absolute', inset: 0, borderRadius: 14,
                      background: cat.bg || 'var(--a-bg)',
                      border: `1px solid ${cat.color}66`,
                      zIndex: -1
                    }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, zIndex: 1 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: cat.color }} />
                  {cat.label}
                </div>
              </button>
            )
          })}
        </LayoutGroup>
      </div>

      <div style={{ width: 1, height: 20, background: isDark ? 'rgba(255,245,220,0.1)' : 'rgba(100,80,40,0.1)', flexShrink: 0 }} />

      {/* Add new */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <AnimatePresence mode="wait">
          {adding ? (
            <motion.div
              key="input" initial={{ width: 0, opacity: 0 }} animate={{ width: 140, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}
            >
              <input
                autoFocus value={newLabel} onChange={e => setNewLabel(e.target.value)}
                onBlur={commitAdd} onKeyDown={e => e.key === 'Enter' && commitAdd()}
                placeholder="Workspace name..."
                style={{
                  width: '100%', padding: '5px 10px', borderRadius: 10, border: '1px solid var(--bd-a)',
                  background: 'var(--a-bg)', color: 'var(--t1)', fontSize: 12, outline: 'none'
                }}
              />
            </motion.div>
          ) : (
            <motion.button
              key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => setAdding(true)}
              style={{
                width: 30, height: 30, borderRadius: 15, border: 'none', background: 'var(--a-bg)',
                color: 'var(--a)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--a-bg2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--a-bg)'}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
