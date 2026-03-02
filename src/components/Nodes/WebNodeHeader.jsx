import { useState, useRef, memo } from 'react'

const WebNodeHeader = memo(function WebNodeHeader({
  id, title, url, favicon, isLoading, isActive,
  onNavigate, onClose, onBack, onForward, onReload, onMinimize,
  theme = 'dark',
}) {
  const [editingUrl, setEditingUrl] = useState(false)
  const [urlInput,   setUrlInput]   = useState('')
  const [tlHover,    setTlHover]    = useState(false)
  const inputRef = useRef(null)
  const isDark = theme === 'dark'

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

  return (
    <div
      className="node-drag-handle"
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 10px', minHeight: 44, flexShrink: 0,
        background: hdrBg,
        borderBottom: `1px solid ${isDark ? 'rgba(255,245,220,0.07)' : 'rgba(100,80,40,0.1)'}`,
        cursor: 'grab', transition: 'background 0.2s ease', userSelect: 'none',
      }}
    >
      {/* Traffic Lights */}
      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}
        onMouseEnter={() => setTlHover(true)}
        onMouseLeave={() => setTlHover(false)}>
        <TL color="#FF5F57" hovered={tlHover} onClick={e => { e.stopPropagation(); onClose() }} title="Close"
          icon={<><path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="rgba(0,0,0,0.55)" strokeWidth="1.3" strokeLinecap="round"/></>}/>
        <TL color="#FEBC2E" hovered={tlHover} onClick={e => { e.stopPropagation(); onMinimize() }} title="Minimize"
          icon={<path d="M1.5 4h5" stroke="rgba(0,0,0,0.55)" strokeWidth="1.3" strokeLinecap="round"/>}/>
        <TL color="#28C840" hovered={tlHover} onClick={e => { e.stopPropagation(); onReload() }} title="Reload"
          icon={<><path d="M6.5 2.5A4 4 0 0 1 5.8 6.5" stroke="rgba(0,0,0,0.55)" strokeWidth="1.3" strokeLinecap="round" fill="none"/><path d="M5.8 2l.7 1.5-1.5.5" stroke="rgba(0,0,0,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></>}/>
      </div>

      {/* Nav buttons */}
      <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        <NavBtn onClick={e => { e.stopPropagation(); onBack() }}    title="Back"    isDark={isDark}><path d="M9 3.5L5.5 7 9 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></NavBtn>
        <NavBtn onClick={e => { e.stopPropagation(); onForward() }} title="Forward" isDark={isDark}><path d="M5.5 3.5L9 7 5.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></NavBtn>
      </div>

      {/* Loading indicator or favicon */}
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
              fontFamily: "'DM Mono', 'JetBrains Mono', monospace", fontSize: 11,
              color: isDark ? '#F5F0E8' : '#1A1712',
              background: isDark ? 'rgba(255,245,220,0.07)' : 'rgba(255,255,255,0.9)',
              border: '1.5px solid var(--bd-a)',
              boxShadow: '0 0 0 3px var(--a-bg)',
            }}
            autoFocus/>
        ) : (
          <div style={{
            padding: '5px 10px', borderRadius: 7, cursor: 'text',
            background: isDark ? 'rgba(255,245,220,0.04)' : 'rgba(100,80,40,0.05)',
            border: `1px solid transparent`,
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 140ms',
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
    </div>
  )
})

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

function SpinIcon({ isDark }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
      <circle cx="6.5" cy="6.5" r="5" stroke={isDark ? '#3A3830' : '#D8D2C4'} strokeWidth="1.5"/>
      <path d="M6.5 1.5A5 5 0 0 1 11.5 6.5" stroke="var(--a)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function GlobeIcon({ isDark }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={isDark ? '#3A3830' : '#D8D2C4'} strokeWidth="1.3"/>
      <path d="M2 8h12M8 2c-2 2-2 8 0 12M8 2c2 2 2 8 0 12" stroke={isDark ? '#3A3830' : '#D8D2C4'} strokeWidth="1.3"/>
    </svg>
  )
}

export default WebNodeHeader
