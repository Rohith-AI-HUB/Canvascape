import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { normalizeUrl, titleFromUrl, faviconUrl } from '../../utils/urlUtils'

const QUICK_ACCESS = [
  { label: 'Google', url: 'https://www.google.com' },
  { label: 'GitHub', url: 'https://github.com' },
  { label: 'YouTube', url: 'https://www.youtube.com' },
  { label: 'Notion', url: 'https://www.notion.so' },
  { label: 'Figma', url: 'https://www.figma.com' },
  { label: 'Linear', url: 'https://linear.app' },
]

export default function FloatingSearchBar() {
  const { isSearchOpen, setSearchOpen, addWebNode } = useWorkspaceStore()
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setSearchOpen])

  useEffect(() => {
    if (isSearchOpen) { setInput(''); setTimeout(() => inputRef.current?.focus(), 60) }
  }, [isSearchOpen])

  const openUrl = useCallback((rawUrl) => {
    const url = normalizeUrl(rawUrl || input)
    addWebNode({ url, title: titleFromUrl(url), favicon: faviconUrl(url), position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 150 } })
    setSearchOpen(false); setInput('')
  }, [input, addWebNode, setSearchOpen])

  if (!isSearchOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setSearchOpen(true)}
        className="fixed z-50 flex items-center gap-2 px-4 py-2.5"
        style={{
          bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(200,189,219,0.5)',
          boxShadow: '0 8px 32px rgba(80,60,140,0.15)',
          color: '#9B91B8', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          cursor: 'pointer', borderRadius: 999,
        }}
        whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="#9B91B8" strokeWidth="1.5"/>
          <path d="M10.5 10.5L14 14" stroke="#9B91B8" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Open a website
        <kbd className="ml-1 px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(155,145,184,0.12)', fontSize: 10 }}>⌘K</kbd>
      </motion.button>
    )
  }

  return (
    <AnimatePresence>
      <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200]"
        style={{ background: 'rgba(61,53,82,0.15)', backdropFilter: 'blur(2px)' }}
        onClick={() => setSearchOpen(false)}
      />
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -12 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed z-[201] w-full max-w-lg"
        style={{
          top: '28%', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(24px)',
          borderRadius: 20, border: '1.5px solid rgba(200,189,219,0.5)',
          boxShadow: '0 24px 64px rgba(80,60,140,0.18)',
          overflow: 'hidden', fontFamily: "'DM Sans', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="6.5" cy="6.5" r="5" stroke="#9B91B8" strokeWidth="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="#9B91B8" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef} value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') openUrl(); if (e.key === 'Escape') setSearchOpen(false) }}
            placeholder="Enter URL or search..."
            className="flex-1 outline-none"
            style={{ color: '#3D3552', background: 'transparent', fontSize: 15, fontFamily: "'DM Sans', sans-serif" }}
          />
          {input && <button onClick={() => setInput('')} style={{ color: '#C8BDDB', fontSize: 18 }}>×</button>}
        </div>

        <div style={{ height: 1, background: 'rgba(200,189,219,0.3)', margin: '0 20px' }} />

        <div className="px-4 py-3">
          <p className="text-xs px-1 pb-2" style={{ color: '#B8ADCC', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10 }}>
            Quick open
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACCESS.map((site) => (
              <button
                key={site.url} onClick={() => openUrl(site.url)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-all"
                style={{ background: 'rgba(124,111,205,0.07)', color: '#6B5FA0', border: '1px solid rgba(124,111,205,0.15)', fontSize: 13, borderRadius: 999 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,111,205,0.14)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(124,111,205,0.07)' }}
              >
                <img src={faviconUrl(site.url)} style={{ width: 14, height: 14, borderRadius: 2, flexShrink: 0 }} alt="" />
                {site.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-3 flex items-center gap-4" style={{ borderTop: '1px solid rgba(200,189,219,0.25)' }}>
          <span className="text-xs" style={{ color: '#C8BDDB' }}>
            <kbd className="px-1.5 py-0.5 rounded text-xs mr-1" style={{ background: 'rgba(200,189,219,0.2)', fontSize: 10 }}>↵</kbd>Open
          </span>
          <span className="text-xs" style={{ color: '#C8BDDB' }}>
            <kbd className="px-1.5 py-0.5 rounded text-xs mr-1" style={{ background: 'rgba(200,189,219,0.2)', fontSize: 10 }}>Esc</kbd>Dismiss
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
