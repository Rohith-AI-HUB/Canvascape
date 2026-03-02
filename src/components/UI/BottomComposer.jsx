import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { normalizeUrl, titleFromUrl, faviconUrl } from '../../utils/urlUtils'

const QUICK_SITES = [
  { label: 'Google', url: 'https://google.com', emoji: '🔍' },
  { label: 'GitHub', url: 'https://github.com', emoji: '🐙' },
  { label: 'YouTube', url: 'https://youtube.com', emoji: '▶️' },
  { label: 'ChatGPT', url: 'https://chat.openai.com', emoji: '✨' },
  { label: 'Notion', url: 'https://notion.so', emoji: '📝' },
  { label: 'Figma', url: 'https://figma.com', emoji: '🎨' },
  { label: 'Gmail', url: 'https://mail.google.com', emoji: '📧' },
  { label: 'Linear', url: 'https://linear.app', emoji: '📐' },
]

export default function BottomComposer() {
  const { isComposerOpen, setComposerOpen, addWebNode, categories } = useWorkspaceStore()
  const [input, setInput] = useState('')
  const [selectedCat, setSelectedCat] = useState(null)
  const inputRef = useRef(null)

  // ⌘N global shortcut handled in App.jsx
  useEffect(() => {
    if (isComposerOpen) {
      setInput('')
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [isComposerOpen])

  const openUrl = useCallback((rawUrl) => {
    const url = normalizeUrl(rawUrl || input)
    addWebNode({
      url,
      title: titleFromUrl(url),
      favicon: faviconUrl(url),
      categoryId: selectedCat,
      position: { x: 180 + Math.random() * 260, y: 100 + Math.random() * 160 },
    })
    setComposerOpen(false)
    setInput('')
    setSelectedCat(null)
  }, [input, selectedCat, addWebNode, setComposerOpen])

  return (
    <>
      {/* Always-visible bottom bar */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4"
        style={{
          height: 52,
          background: 'rgba(250,248,255,0.97)',
          borderTop: '1px solid rgba(200,189,219,0.25)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Sidebar toggle */}
        <SidebarToggleButton />

        {/* Composer trigger */}
        <button
          onClick={() => setComposerOpen(true)}
          className="flex-1 flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-left transition-all"
          style={{
            background: 'rgba(255,255,255,0.8)',
            border: '1px solid rgba(200,189,219,0.4)',
            color: '#B8ADCC',
            boxShadow: '0 2px 8px rgba(120,100,180,0.06)',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,111,205,0.35)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(200,189,219,0.4)'}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>Open a website or search...</span>
          <kbd className="ml-auto text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(155,145,184,0.12)', fontFamily: 'monospace', fontSize: 10 }}>⌘N</kbd>
        </button>

        {/* Home / fit view */}
        <FitViewButton />
      </div>

      {/* Composer modal */}
      <AnimatePresence>
        {isComposerOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300]"
              style={{ background: 'rgba(61,53,82,0.18)', backdropFilter: 'blur(3px)' }}
              onClick={() => setComposerOpen(false)}
            />
            <motion.div
              key="composer"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed z-[301]"
              style={{
                bottom: 68, left: '50%', transform: 'translateX(-50%)',
                width: 540,
                background: 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(24px)',
                borderRadius: 20,
                border: '1.5px solid rgba(200,189,219,0.5)',
                boxShadow: '0 -8px 40px rgba(80,60,140,0.14), 0 4px 20px rgba(80,60,140,0.08)',
                fontFamily: "'DM Sans', sans-serif",
                overflow: 'hidden',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Input row */}
              <div className="flex items-center gap-3 px-5 py-4">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: '#B8ADCC' }}>
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') openUrl()
                    if (e.key === 'Escape') setComposerOpen(false)
                    e.stopPropagation()
                  }}
                  placeholder="Enter URL or search the web..."
                  className="flex-1 outline-none bg-transparent text-sm"
                  style={{ color: '#3D3552' }}
                />
                {input && (
                  <button onClick={() => setInput('')} style={{ color: '#C8BDDB', fontSize: 18, lineHeight: 1 }}>×</button>
                )}
              </div>

              {/* Category selector */}
              {categories.length > 0 && (
                <div className="px-5 pb-3 flex items-center gap-2">
                  <span className="text-xs" style={{ color: '#B8ADCC' }}>Add to:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => setSelectedCat(null)}
                      className="px-2.5 py-1 rounded-full text-xs transition-all"
                      style={{
                        background: selectedCat === null ? 'rgba(124,111,205,0.15)' : 'rgba(124,111,205,0.06)',
                        color: selectedCat === null ? '#7C6FCD' : '#9B91B8',
                        border: selectedCat === null ? '1px solid rgba(124,111,205,0.3)' : '1px solid transparent',
                      }}
                    >
                      None
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
                        className="px-2.5 py-1 rounded-full text-xs flex items-center gap-1 transition-all"
                        style={{
                          background: selectedCat === cat.id ? cat.colorBg : 'rgba(124,111,205,0.04)',
                          color: selectedCat === cat.id ? cat.color : '#9B91B8',
                          border: selectedCat === cat.id ? `1px solid ${cat.color}55` : '1px solid transparent',
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ height: 1, background: 'rgba(200,189,219,0.25)', margin: '0 20px' }} />

              {/* Quick sites */}
              <div className="px-4 py-3">
                <p className="text-xs px-1 pb-2" style={{ color: '#C8BDDB', textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: 10 }}>Quick open</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SITES.map(site => (
                    <button
                      key={site.url}
                      onClick={() => openUrl(site.url)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
                      style={{ background: 'rgba(124,111,205,0.07)', color: '#6B5FA0', border: '1px solid rgba(124,111,205,0.15)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,111,205,0.14)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,111,205,0.07)'}
                    >
                      <span>{site.emoji}</span>{site.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer hints */}
              <div className="px-5 py-2.5 flex items-center gap-4" style={{ borderTop: '1px solid rgba(200,189,219,0.2)' }}>
                {[['↵', 'Open'], ['Esc', 'Close']].map(([key, label]) => (
                  <span key={key} className="text-xs flex items-center gap-1" style={{ color: '#C8BDDB' }}>
                    <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(200,189,219,0.2)', fontFamily: 'monospace', fontSize: 10 }}>{key}</kbd>
                    {label}
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

function SidebarToggleButton() {
  const { isSidebarOpen, toggleSidebar } = useWorkspaceStore()
  return (
    <button
      onClick={toggleSidebar}
      className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 transition-all"
      style={{ color: isSidebarOpen ? '#7C6FCD' : '#C8BDDB', background: isSidebarOpen ? 'rgba(124,111,205,0.10)' : 'transparent' }}
      title="Toggle sidebar (⌘\\)"
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,111,205,0.10)'}
      onMouseLeave={e => e.currentTarget.style.background = isSidebarOpen ? 'rgba(124,111,205,0.10)' : 'transparent'}
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 3v10" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    </button>
  )
}

function FitViewButton() {
  // This needs to be inside ReactFlowProvider — so it posts a custom event
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('canvascape:fitview'))}
      className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 transition-all"
      style={{ color: '#C8BDDB' }}
      title="Fit all cards in view"
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,111,205,0.10)'; e.currentTarget.style.color = '#7C6FCD' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C8BDDB' }}
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}
