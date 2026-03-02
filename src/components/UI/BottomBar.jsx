import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { normalizeUrl, titleFromUrl, faviconUrl } from '../../utils/urlUtils'

const QUICK = [
  { label: 'Google',  url: 'https://google.com',      accent: '#4F8DF7' },
  { label: 'GitHub',  url: 'https://github.com',      accent: '#171515' },
  { label: 'YouTube', url: 'https://youtube.com',     accent: '#FF3434' },
  { label: 'ChatGPT', url: 'https://chat.openai.com', accent: '#10A37F' },
  { label: 'Notion',  url: 'https://notion.so',       accent: '#303030' },
  { label: 'Figma',   url: 'https://figma.com',       accent: '#A259FF' },
  { label: 'Gmail',   url: 'https://mail.google.com', accent: '#EA4335' },
  { label: 'Linear',  url: 'https://linear.app',      accent: '#5E6AD2' },
]

function modifierLabel() {
  if (typeof window !== 'undefined' && window.canvascape?.platform === 'darwin') return 'Cmd'
  if (typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)) return 'Cmd'
  return 'Ctrl'
}

export default function BottomBar() {
  const {
    isComposerOpen,
    setComposerOpen,
    isSidebarOpen,
    toggleSidebar,
    addWebNode,
    categories,
  } = useWorkspaceStore()

  const [input, setInput] = useState('')
  const [selCat, setSelCat] = useState(null)
  const inputRef = useRef(null)
  const hotkey = useMemo(() => `${modifierLabel()}+N`, [])

  useEffect(() => {
    if (!isComposerOpen) return
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 70)
  }, [isComposerOpen])

  const closeComposer = useCallback(() => {
    setComposerOpen(false)
    setSelCat(null)
  }, [setComposerOpen])

  const open = useCallback((rawUrl) => {
    const url = normalizeUrl(rawUrl || input)
    addWebNode({
      url,
      title: titleFromUrl(url),
      favicon: faviconUrl(url),
      categoryId: selCat,
      position: { x: 180 + Math.random() * 260, y: 100 + Math.random() * 160 },
    })
    setComposerOpen(false)
    setInput('')
    setSelCat(null)
  }, [input, selCat, addWebNode, setComposerOpen])

  return (
    <>
      <div className="cc-bottom-bar" role="toolbar" aria-label="Workspace controls">
        <div className="cc-bottom-bar__inner">
          <IconButton
            title={`Toggle sidebar (${hotkey.replace('+N', '+\\')})`}
            active={isSidebarOpen}
            onClick={toggleSidebar}
          >
            <rect x="2" y="2" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 2v12" stroke="currentColor" strokeWidth="1.5" />
          </IconButton>

          <button type="button" className="cc-launch-trigger" onClick={() => setComposerOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="cc-launch-trigger__text">Open website or search</span>
            <kbd className="cc-hotkey">{hotkey}</kbd>
          </button>

          <IconButton
            title="Fit all cards"
            onClick={() => window.dispatchEvent(new CustomEvent('canvas:fitview'))}
          >
            <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </IconButton>
        </div>
      </div>

      <AnimatePresence>
        {isComposerOpen && (
          <>
            <motion.button
              key="composer-backdrop"
              type="button"
              aria-label="Close composer"
              className="cc-composer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeComposer}
            />

            <motion.div
              key="composer-panel"
              className="cc-composer-panel"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cc-composer-head">
                <p className="cc-composer-eyebrow">New Card</p>
                <h2 className="cc-composer-title">Paste a link or type a query</h2>
              </div>

              <div className="cc-composer-field">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') open()
                    if (e.key === 'Escape') closeComposer()
                    e.stopPropagation()
                  }}
                  placeholder="https://example.com or write your search"
                  className="cc-composer-input"
                />
                {input && (
                  <button type="button" className="cc-clear-btn" onClick={() => setInput('')} aria-label="Clear input">
                    x
                  </button>
                )}
                <button type="button" className="cc-open-btn" onClick={() => open()}>
                  Open
                </button>
              </div>

              {categories.length > 0 && (
                <section className="cc-composer-section">
                  <p className="cc-composer-label">Category</p>
                  <div className="cc-chip-row">
                    <CategoryChip
                      label="None"
                      color="#7A6D93"
                      bg="rgba(122, 109, 147, 0.08)"
                      active={selCat === null}
                      onClick={() => setSelCat(null)}
                    />
                    {categories.map((cat) => (
                      <CategoryChip
                        key={cat.id}
                        label={cat.label}
                        color={cat.color}
                        bg={cat.bg}
                        active={selCat === cat.id}
                        onClick={() => setSelCat(selCat === cat.id ? null : cat.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              <section className="cc-composer-section">
                <p className="cc-composer-label">Quick Open</p>
                <div className="cc-quick-grid">
                  {QUICK.map((site) => (
                    <button
                      key={site.url}
                      type="button"
                      className="cc-quick-chip"
                      style={{ '--cc-quick-accent': site.accent }}
                      onClick={() => open(site.url)}
                    >
                      <span className="cc-quick-chip__dot" aria-hidden="true" />
                      {site.label}
                    </button>
                  ))}
                </div>
              </section>

              <div className="cc-composer-foot">
                <Hint k="Enter" label="Open" />
                <Hint k="Esc" label="Dismiss" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function CategoryChip({ label, color, bg, active, onClick }) {
  return (
    <button
      type="button"
      className="cc-chip"
      data-active={active ? 'true' : 'false'}
      style={{ '--cc-chip-color': color, '--cc-chip-bg': bg ?? 'rgba(124,111,205,0.1)' }}
      onClick={onClick}
    >
      <span className="cc-chip__dot" aria-hidden="true" />
      {label}
    </button>
  )
}

function Hint({ k, label }) {
  return (
    <span className="cc-hint">
      <kbd>{k}</kbd>
      {label}
    </span>
  )
}

function IconButton({ onClick, title, active = false, children }) {
  return (
    <button
      type="button"
      className="cc-icon-btn"
      data-active={active ? 'true' : 'false'}
      onClick={onClick}
      title={title}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">{children}</svg>
    </button>
  )
}
