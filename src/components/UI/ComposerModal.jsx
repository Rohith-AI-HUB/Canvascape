import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { normalizeUrl, titleFromUrl, faviconUrl } from '../../utils/urlUtils'

const QUICK = [
  { label: 'Google',   url: 'https://google.com' },
  { label: 'YouTube',  url: 'https://youtube.com' },
  { label: 'GitHub',   url: 'https://github.com' },
  { label: 'ChatGPT',  url: 'https://chat.openai.com' },
  { label: 'Gmail',    url: 'https://mail.google.com' },
  { label: 'Notion',   url: 'https://notion.so' },
  { label: 'Figma',    url: 'https://figma.com' },
  { label: 'Reddit',   url: 'https://reddit.com' },
  { label: 'X',        url: 'https://x.com' },
  { label: 'Linear',   url: 'https://linear.app' },
]

export default function ComposerModal() {
  const { isComposerOpen, setComposerOpen, addWebNode, workspaces, activeWorkspaceId, theme } = useWorkspaceStore()
  const [input, setInput]   = useState('')
  const [selCat, setSelCat] = useState(activeWorkspaceId)
  const inputRef = useRef(null)
  const isDark = theme === 'dark'

  useEffect(() => {
    if (!isComposerOpen) return
    setInput(''); setSelCat(activeWorkspaceId)
    setTimeout(() => inputRef.current?.focus(), 60)
  }, [isComposerOpen, activeWorkspaceId])

  const close = useCallback(() => setComposerOpen(false), [setComposerOpen])

  const open = useCallback((rawUrl) => {
    const url = normalizeUrl(rawUrl || input)
    addWebNode({ url, title: titleFromUrl(url), favicon: faviconUrl(url), workspaceId: selCat,
      position: { x: 160 + Math.random() * 300, y: 80 + Math.random() * 180 } })
    setComposerOpen(false); setInput(''); setSelCat(null)
  }, [input, selCat, addWebNode, setComposerOpen])

  return (
    <AnimatePresence>
      {isComposerOpen && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 300, background: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(20,15,5,0.3)', backdropFilter: 'blur(6px)' }}
            onClick={close}/>

          <motion.div key="cp"
            initial={{ opacity: 0, y: 16, scale: 0.97, x: '-50%' }}
            animate={{ opacity: 1, y: '-50%', scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 10, scale: 0.97, x: '-50%' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed', zIndex: 301,
              top: '50%', left: '50%',
              width: 'min(600px, calc(100vw - 24px))',
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
            {workspaces.length > 0 && (
              <div style={{ padding: '12px 20px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,245,220,0.07)' : 'rgba(100,80,40,0.08)'}` }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 10 }}>Add to workspace</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingBottom: 12 }}>
                  {[{ id: null, label: 'None', color: 'var(--t3)', bg: 'var(--s2)' }, ...workspaces].map(c => (
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
                    <img src={faviconUrl(s.url)} style={{ width: 14, height: 14, borderRadius: 2, flexShrink: 0 }} alt="" />
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
  )
}
