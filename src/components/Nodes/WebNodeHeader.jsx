import { useState, useRef, memo, useCallback } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { normalizeUrl } from '../../utils/urlUtils'

const WebNodeHeader = memo(function WebNodeHeader({
  id, title, url, favicon, isLoading, isActive,
  onNavigate, onClose, onBack, onForward, onReload, onMinimize,
  theme = 'dark',
}) {
  const { toggleNotePanel, addTab, switchTab, closeTab, updateNodeData, nodes } = useWorkspaceStore()
  const node = nodes.find((n) => n.id === id)
  const tabs       = node?.data?.tabs ?? []
  const activeIdx  = node?.data?.activeTabIdx ?? 0
  const isNoteOpen = node?.data?.isNoteOpen ?? false

  const [editingUrl, setEditingUrl] = useState(false)
  const [urlInput,   setUrlInput]   = useState('')
  const [tlHover,    setTlHover]    = useState(false)
  const [addingTab,  setAddingTab]  = useState(false)
  const [newTabUrl,  setNewTabUrl]  = useState('')
  const inputRef    = useRef(null)
  const tabInputRef = useRef(null)
  const isDark      = theme === 'dark'

  const startEditing = () => {
    setUrlInput(url || '')
    setEditingUrl(true)
    setTimeout(() => inputRef.current?.select(), 30)
  }

  const commitUrl = () => {
    setEditingUrl(false)
    const trimmed = urlInput.trim()
    if (trimmed && trimmed !== url) onNavigate(trimmed)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter')  commitUrl()
    if (e.key === 'Escape') setEditingUrl(false)
    e.stopPropagation()
  }

  // Open new tab
  const openNewTab = useCallback(() => {
    setAddingTab(true)
    setNewTabUrl('')
    setTimeout(() => tabInputRef.current?.focus(), 40)
  }, [])

  const commitNewTab = useCallback(() => {
    const trimmed = newTabUrl.trim()
    setAddingTab(false)
    setNewTabUrl('')
    if (!trimmed) return
    const url = normalizeUrl(trimmed)
    addTab(id, url, url, null)
  }, [id, newTabUrl, addTab])

  const onTabInputKey = (e) => {
    if (e.key === 'Enter')  commitNewTab()
    if (e.key === 'Escape') { setAddingTab(false); setNewTabUrl('') }
    e.stopPropagation()
  }

  const displayHost = (() => {
    try {
      const u = new URL(url)
      const path = u.pathname !== '/' ? u.pathname.slice(0, 18) + (u.pathname.length > 18 ? '…' : '') : ''
      return u.hostname.replace('www.', '') + path
    } catch { return url || '' }
  })()

  const hdrBg = isDark
    ? isActive ? '#1A1916' : '#141310'
    : isActive ? '#F7F4EE' : '#FFFFFF'

  const divider = isDark ? 'rgba(255,245,220,0.07)' : 'rgba(100,80,40,0.1)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, background: hdrBg, borderBottom: `1px solid ${divider}`, transition: 'background 0.2s ease' }}>

      {/* ── Main header row ── */}
      <div
        className="node-drag-handle"
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', minHeight: 44, cursor: 'grab', userSelect: 'none' }}
      >
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}
          onMouseEnter={() => setTlHover(true)}
          onMouseLeave={() => setTlHover(false)}>
          <TL color="#FF5F57" hovered={tlHover} onClick={e => { e.stopPropagation(); onClose() }} title="Close"
            icon={<><path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="rgba(0,0,0,0.55)" strokeWidth="1.3" strokeLinecap="round"/></>}/>
          <TL color="#FEBC2E" hovered={tlHover} onClick={e => { e.stopPropagation(); onMinimize() }} title="Minimize"
            icon={<path d="M1.5 4h5" stroke="rgba(0,0,0,0.55)" strokeWidth="1.3" strokeLinecap="round"/>}/>
          <TL color="#28C840" hovered={tlHover} onClick={e => { e.stopPropagation(); onReload() }} title="Reload"
            icon={<><path d="M1.5 4.5a3 3 0 1 1 3-3" stroke="rgba(0,0,0,0.6)" strokeWidth="1.2" strokeLinecap="round" fill="none"/><path d="M3.5 1l1 1-1 1" stroke="rgba(0,0,0,0.6)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></>}/>
        </div>

        {/* Nav buttons */}
        <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <NavBtn onClick={e => { e.stopPropagation(); onBack() }}    title="Back"    isDark={isDark}><path d="M9 3.5L5.5 7 9 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></NavBtn>
          <NavBtn onClick={e => { e.stopPropagation(); onForward() }} title="Forward" isDark={isDark}><path d="M5.5 3.5L9 7 5.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></NavBtn>
        </div>

        {/* Favicon / spinner */}
        <div style={{ width: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {isLoading
            ? <SpinIcon isDark={isDark}/>
            : favicon
              ? <img src={favicon} style={{ width: 14, height: 14, borderRadius: 3 }} onError={e => e.target.style.display = 'none'}/>
              : <GlobeIcon isDark={isDark}/>
          }
        </div>

        {/* URL bar */}
        <div style={{ flex: 1, minWidth: 0 }} onClick={e => { e.stopPropagation(); startEditing() }}>
          {editingUrl ? (
            <input ref={inputRef} value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onBlur={commitUrl} onKeyDown={onKeyDown}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', padding: '4px 10px', borderRadius: 7, outline: 'none',
                fontFamily: "'DM Mono', monospace", fontSize: 11,
                color: isDark ? '#F5F0E8' : '#1A1712',
                background: isDark ? 'rgba(255,245,220,0.07)' : 'rgba(255,255,255,0.9)',
                border: '1.5px solid var(--bd-a)', boxShadow: '0 0 0 3px var(--a-bg)',
              }}
              autoFocus/>
          ) : (
            <div style={{
              padding: '5px 10px', borderRadius: 7, cursor: 'text',
              background: isDark ? 'rgba(255,245,220,0.04)' : 'rgba(100,80,40,0.05)',
              border: '1px solid transparent', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 140ms',
            }}
              title={url}
              onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,245,220,0.07)' : 'rgba(100,80,40,0.08)'; e.currentTarget.style.borderColor = 'var(--bd-h)' }}
              onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(255,245,220,0.04)' : 'rgba(100,80,40,0.05)'; e.currentTarget.style.borderColor = 'transparent' }}>
              {title && title !== displayHost ? (
                <>
                  <span style={{ fontSize: 12, fontWeight: 500, color: isDark ? '#B8B09A' : '#4E4A3E', flexShrink: 0, maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
                  <span style={{ fontSize: 11, color: isDark ? '#3A3830' : '#9A9282', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Mono', monospace" }}>{displayHost}</span>
                </>
              ) : (
                <span style={{ fontSize: 11, color: isDark ? '#6A6454' : '#9A9282', fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayHost}</span>
              )}
            </div>
          )}
        </div>

        {/* Note toggle button */}
        <IconBtn
          onClick={e => { e.stopPropagation(); toggleNotePanel(id) }}
          title={isNoteOpen ? 'Hide note' : 'Show note'}
          active={isNoteOpen}
          isDark={isDark}
        >
          <path d="M3 3h10v7H8l-2 3v-3H3V3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        </IconBtn>

        {/* New tab button */}
        <IconBtn
          onClick={e => { e.stopPropagation(); openNewTab() }}
          title="Open new tab in this card"
          isDark={isDark}
        >
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </IconBtn>
      </div>

      {/* ── Tab bar (shown only when multiple tabs) ── */}
      {tabs.length > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', overflowX: 'auto', gap: 2,
          padding: '0 10px', borderTop: `1px solid ${divider}`, minHeight: 34,
          background: isDark ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.03)',
        }}>
          {tabs.map((tab, i) => {
            const isActive = i === activeIdx
            return (
              <div
                key={i}
                onClick={e => { e.stopPropagation(); if (!isActive) { switchTab(id, i) } }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px 4px 8px', borderRadius: 7, flexShrink: 0, maxWidth: 160,
                  background: isActive ? (isDark ? 'rgba(255,245,220,0.08)' : 'rgba(100,80,40,0.08)') : 'transparent',
                  border: `1px solid ${isActive ? 'var(--bd-a)' : 'transparent'}`,
                  cursor: isActive ? 'default' : 'pointer',
                  transition: 'all 120ms',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(255,245,220,0.04)' : 'rgba(100,80,40,0.04)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                {tab.favicon
                  ? <img src={tab.favicon} style={{ width: 11, height: 11, borderRadius: 2, flexShrink: 0 }} onError={e => e.target.style.display = 'none'}/>
                  : <GlobeIcon isDark={isDark} size={10}/>
                }
                <span style={{ fontSize: 11, color: isActive ? 'var(--t1)' : 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isActive ? 500 : 400 }}>
                  {tab.title || tab.url || 'Tab'}
                </span>
                {/* Close tab button */}
                <button
                  onClick={e => { e.stopPropagation(); closeTab(id, i) }}
                  style={{ width: 14, height: 14, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, color: 'var(--t3)', flexShrink: 0, fontSize: 12, lineHeight: 1 }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.15)'; e.currentTarget.style.color = '#FF5F57' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t3)' }}
                  title="Close tab"
                >×</button>
              </div>
            )
          })}

          {/* New tab shortcut in tab bar */}
          <button
            onClick={e => { e.stopPropagation(); openNewTab() }}
            style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 16, flexShrink: 0, lineHeight: 1 }}
            onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,245,220,0.06)' : 'rgba(100,80,40,0.06)'; e.currentTarget.style.color = 'var(--t2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t3)' }}
            title="New tab"
          >+</button>
        </div>
      )}

      {/* ── New tab URL input ── */}
      {addingTab && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderTop: `1px solid ${divider}`, background: isDark ? 'rgba(255,245,220,0.02)' : 'rgba(100,80,40,0.02)' }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--t3)', flexShrink: 0 }}>
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={tabInputRef}
            value={newTabUrl}
            onChange={e => setNewTabUrl(e.target.value)}
            onKeyDown={onTabInputKey}
            onBlur={() => { setAddingTab(false); setNewTabUrl('') }}
            placeholder="Enter URL or search… (↵ to open)"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--t1)', fontSize: 12, fontFamily: 'inherit' }}
            onClick={e => e.stopPropagation()}
          />
          <span style={{ fontSize: 10, color: 'var(--t4)' }}>↵ open · Esc cancel</span>
        </div>
      )}
    </div>
  )
})

// ── Sub-components ────────────────────────────────────────────────────────────
function TL({ color, hovered, onClick, title, icon }) {
  return (
    <button onClick={onClick} title={title}
      style={{ width: 13, height: 13, borderRadius: '50%', background: color, border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.1s, filter 0.1s', boxShadow: `0 1px 3px ${color}50` }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.filter = 'brightness(1.1)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.filter = '' }}>
      {hovered && <svg width="7" height="7" viewBox="0 0 8 8" fill="none">{icon}</svg>}
    </button>
  )
}

function NavBtn({ onClick, title, isDark, children }) {
  return (
    <button onClick={onClick} title={title}
      style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#3A3830' : '#C8C0B0', transition: 'all 0.12s', fontFamily: 'inherit' }}
      onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,245,220,0.07)' : 'rgba(100,80,40,0.08)'; e.currentTarget.style.color = isDark ? '#B8B09A' : '#4E4A3E' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isDark ? '#3A3830' : '#C8C0B0' }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">{children}</svg>
    </button>
  )
}

function IconBtn({ onClick, title, active, isDark, children }) {
  return (
    <button onClick={onClick} title={title}
      style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'var(--a-bg)' : 'transparent', border: active ? '1px solid var(--bd-a)' : '1px solid transparent', cursor: 'pointer', color: active ? 'var(--a)' : (isDark ? '#3A3830' : '#C8C0B0'), transition: 'all 0.12s', padding: 0, flexShrink: 0 }}
      onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,245,220,0.07)' : 'rgba(100,80,40,0.08)'; e.currentTarget.style.color = isDark ? '#B8B09A' : '#4E4A3E' }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? 'var(--a-bg)' : 'transparent'; e.currentTarget.style.color = active ? 'var(--a)' : (isDark ? '#3A3830' : '#C8C0B0') }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">{children}</svg>
    </button>
  )
}

function SpinIcon({ isDark }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
      <circle cx="6.5" cy="6.5" r="5" stroke={isDark ? '#3A3830' : '#D8D2C4'} strokeWidth="1.5"/>
      <path d="M6.5 1.5A5 5 0 0 1 11.5 6.5" stroke="var(--a)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function GlobeIcon({ isDark, size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={isDark ? '#3A3830' : '#D8D2C4'} strokeWidth="1.3"/>
      <path d="M2 8h12M8 2c-2 2-2 8 0 12M8 2c2 2 2 8 0 12" stroke={isDark ? '#3A3830' : '#D8D2C4'} strokeWidth="1.3"/>
    </svg>
  )
}

export default WebNodeHeader
