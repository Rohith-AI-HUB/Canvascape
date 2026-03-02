import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { normalizeUrl, titleFromUrl, faviconUrl } from '../../utils/urlUtils'

const QUICK = [
  { label: 'Google',   url: 'https://google.com',      emoji: '🔍' },
  { label: 'YouTube',  url: 'https://youtube.com',     emoji: '▶' },
  { label: 'GitHub',   url: 'https://github.com',      emoji: '⬡' },
  { label: 'ChatGPT',  url: 'https://chat.openai.com', emoji: '✦' },
  { label: 'Gmail',    url: 'https://mail.google.com', emoji: '✉' },
  { label: 'Notion',   url: 'https://notion.so',       emoji: '▣' },
  { label: 'Figma',    url: 'https://figma.com',       emoji: '◈' },
  { label: 'Reddit',   url: 'https://reddit.com',      emoji: '◉' },
  { label: 'X',        url: 'https://x.com',           emoji: '✕' },
  { label: 'Linear',   url: 'https://linear.app',      emoji: '◆' },
]

function modKey() {
  if (typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)) return '⌘'
  return 'Ctrl+'
}

export default function BottomBar() {
  const { isComposerOpen, setComposerOpen, isSidebarOpen, toggleSidebar,
    addWebNode, categories, theme, toggleTheme } = useWorkspaceStore()
  const [input, setInput]   = useState('')
  const [selCat, setSelCat] = useState(null)
  const inputRef = useRef(null)
  const mod = useMemo(() => modKey(), [])
  const isDark = theme === 'dark'

  useEffect(() => {
    if (!isComposerOpen) return
    setInput(''); setSelCat(null)
    setTimeout(() => inputRef.current?.focus(), 60)
  }, [isComposerOpen])

  const close = useCallback(() => setComposerOpen(false), [setComposerOpen])

  const open = useCallback((rawUrl) => {
    const url = normalizeUrl(rawUrl || input)
    addWebNode({ url, title: titleFromUrl(url), favicon: faviconUrl(url), categoryId: selCat,
      position: { x: 160 + Math.random() * 300, y: 80 + Math.random() * 180 } })
    setComposerOpen(false); setInput(''); setSelCat(null)
  }, [input, selCat, addWebNode, setComposerOpen])

  const barBg = isDark ? 'rgba(14,13,10,0.97)' : 'rgba(250,248,242,0.97)'
  const barBorder = isDark ? 'rgba(255,245,220,0.07)' : 'rgba(100,80,40,0.1)'

  return (
    <>
      {/* ── Bottom Bar ── */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 12px', height: 50,
        background: barBg, borderTop: `1px solid ${barBorder}`,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        {/* Sidebar toggle */}
        <BarBtn onClick={toggleSidebar} title="Toggle sidebar (Ctrl+\)" active={isSidebarOpen} isDark={isDark}>
          <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M6 2v12" stroke="currentColor" strokeWidth="1.4"/>
        </BarBtn>

        <div style={{ width: 1, height: 18, background: isDark ? 'rgba(255,245,220,0.08)' : 'rgba(100,80,40,0.1)', flexShrink: 0 }}/>

        {/* Search / Open trigger */}
        <button onClick={() => setComposerOpen(true)}
          style={{
            flex: 1, height: 36, borderRadius: 10, border: `1px solid ${isDark ? 'rgba(255,245,220,0.08)' : 'rgba(100,80,40,0.12)'}`,
            background: isDark ? 'rgba(255,245,220,0.03)' : 'rgba(100,80,40,0.04)',
            display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", transition: 'all 140ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bd-a)'; e.currentTarget.style.background = 'var(--a-bg)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(255,245,220,0.08)' : 'rgba(100,80,40,0.12)'; e.currentTarget.style.background = isDark ? 'rgba(255,245,220,0.03)' : 'rgba(100,80,40,0.04)' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--t3)', flexShrink: 0 }}>
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ flex: 1, textAlign: 'left', fontSize: 13, color: 'var(--t3)' }}>Open a website…</span>
          <kbd style={{ background: 'var(--s3)', border: '1px solid var(--bd)', borderRadius: 6, padding: '2px 7px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--t3)', whiteSpace: 'nowrap' }}>{mod}N</kbd>
        </button>

        <div style={{ width: 1, height: 18, background: isDark ? 'rgba(255,245,220,0.08)' : 'rgba(100,80,40,0.1)', flexShrink: 0 }}/>

        {/* Fit view */}
        <BarBtn onClick={() => window.dispatchEvent(new CustomEvent('canvas:fitview'))} title="Fit all tabs in view" isDark={isDark}>
          <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </BarBtn>

        {/* Theme */}
        <BarBtn onClick={toggleTheme} title={isDark ? 'Light mode' : 'Dark mode'} isDark={isDark}>
          {isDark
            ? <><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M8 2v1M8 13v1M2 8h1M13 8h1M3.9 3.9l.7.7M11.4 11.4l.7.7M11.4 3.9l-.7.7M4.6 11.4l-.7.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></>
            : <path d="M13.5 9A6 6 0 0 1 7 2.5 5.5 5.5 0 1 0 13.5 9z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
          }
        </BarBtn>


      </div>

      {/* ── Composer Modal ── */}
      <AnimatePresence>
        {isComposerOpen && (
          <>
            <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 300, background: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(20,15,5,0.3)', backdropFilter: 'blur(6px)' }}
              onClick={close}/>

            <motion.div key="cp"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              style={{
                position: 'fixed', zIndex: 301,
                bottom: 62, left: '50%', transform: 'translateX(-50%)',
                width: 'min(600px, calc(100vw - 24px)',
                background: isDark ? '#141310' : '#FFFFFF',
                border: `1px solid ${isDark ? 'rgba(255,245,220,0.12)' : 'rgba(100,80,40,0.15)'}`,
                borderRadius: 20,
                boxShadow: isDark ? '0 -4px 40px rgba(0,0,0,0.9), 0 24px 60px rgba(0,0,0,0.8)' : '0 -4px 40px rgba(0,0,0,0.12), 0 24px 60px rgba(0,0,0,0.1)',
                overflow: 'hidden', fontFamily: "'DM Sans', sans-serif",
              }}>

              {/* Amber top accent line */}
              <div style={{ height: 2, background: 'linear-gradient(90deg, transparent 0%, var(--a) 30%, var(--a2) 70%, transparent 100%)', opacity: 0.7 }}/>

              {/* Input row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: `1px solid ${isDark ? 'rgba(255,245,220,0.07)' : 'rgba(100,80,40,0.08)'}` }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--t3)', flexShrink: 0 }}>
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') open(); if (e.key === 'Escape') close(); e.stopPropagation() }}
                  placeholder="Paste a URL or type to search…"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--t1)', fontSize: 15, fontFamily: 'inherit' }}/>
                {input && <button onClick={() => setInput('')} style={{ color: 'var(--t3)', fontSize: 20, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, fontFamily: 'inherit' }}>×</button>}
                <button onClick={() => open()}
                  style={{ height: 34, padding: '0 16px', borderRadius: 10, border: '1px solid var(--bd-a)', background: 'var(--a-bg)', color: 'var(--a)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 140ms', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--a-bg2)'; e.currentTarget.style.boxShadow = '0 4px 16px var(--a-glow)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--a-bg)'; e.currentTarget.style.boxShadow = 'none' }}>
                  Open →
                </button>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div style={{ padding: '12px 20px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,245,220,0.07)' : 'rgba(100,80,40,0.08)'}` }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 10 }}>Add to workspace</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingBottom: 12 }}>
                    {[{ id: null, label: 'None', color: 'var(--t3)', bg: 'var(--s2)' }, ...categories].map(c => (
                      <button key={c.id ?? 'none'} onClick={() => setSelCat(c.id)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px',
                          borderRadius: 999, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
                          background: selCat === c.id ? (c.bg || 'var(--a-bg)') : 'var(--s2)',
                          color: selCat === c.id ? (c.color || 'var(--a)') : 'var(--t3)',
                          border: selCat === c.id ? `1px solid ${c.color || 'var(--a)'}66` : '1px solid var(--bd)',
                          transition: 'all 130ms',
                        }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }}/>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick open */}
              <div style={{ padding: '12px 20px 16px' }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 10 }}>Quick open</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {QUICK.map(s => (
                    <button key={s.url} onClick={() => open(s.url)}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--bd)', background: 'var(--s2)', color: 'var(--t2)', fontSize: 12.5, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 140ms', textAlign: 'left', fontWeight: 500 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bd-a)'; e.currentTarget.style.background = 'var(--a-bg)'; e.currentTarget.style.color = 'var(--a)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd)'; e.currentTarget.style.background = 'var(--s2)'; e.currentTarget.style.color = 'var(--t2)' }}>
                      <span style={{ fontSize: 13, lineHeight: 1 }}>{s.emoji}</span>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', gap: 16, padding: '10px 20px 14px', borderTop: `1px solid ${isDark ? 'rgba(255,245,220,0.07)' : 'rgba(100,80,40,0.08)'}` }}>
                {[['↵', 'Open'], ['Esc', 'Close']].map(([k, l]) => (
                  <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--t3)' }}>
                    <kbd style={{ background: 'var(--s3)', border: '1px solid var(--bd)', borderRadius: 6, padding: '2px 7px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--t3)' }}>{k}</kbd>
                    {l}
                  </span>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function BarBtn({ onClick, title, active, isDark, children }) {
  return (
    <button onClick={onClick} title={title}
      style={{
        width: 34, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'var(--a-bg)' : 'transparent',
        color: active ? 'var(--a)' : 'var(--t3)',
        transition: 'all 130ms', fontFamily: 'inherit',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--s3)'; e.currentTarget.style.color = 'var(--t2)' }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? 'var(--a-bg)' : 'transparent'; e.currentTarget.style.color = active ? 'var(--a)' : 'var(--t3)' }}>
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">{children}</svg>
    </button>
  )
}
