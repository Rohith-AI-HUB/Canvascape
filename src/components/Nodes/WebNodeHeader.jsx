import { useState, useRef, memo } from 'react'

const WebNodeHeader = memo(function WebNodeHeader({
  id, title, url, favicon, isLoading, isActive,
  onNavigate, onClose, onBack, onForward, onReload,
}) {
  const [editingUrl, setEditingUrl] = useState(false)
  const [urlInput,   setUrlInput]   = useState('')
  const inputRef = useRef(null)

  const startEditing = () => {
    setUrlInput(url || '')
    setEditingUrl(true)
    setTimeout(() => inputRef.current?.select(), 30)
  }

  const commitUrl = () => {
    setEditingUrl(false)
    if (urlInput.trim()) onNavigate(urlInput.trim())
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter')  commitUrl()
    if (e.key === 'Escape') setEditingUrl(false)
    e.stopPropagation()
  }

  const displayUrl = (() => {
    try {
      const u = new URL(url)
      const p = u.pathname !== '/' ? u.pathname.slice(0, 22) + (u.pathname.length > 22 ? '…' : '') : ''
      return u.hostname + p
    } catch { return url || '' }
  })()

  return (
    <div
      className="node-drag-handle"
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 10px',
        background: isActive ? '#1C1C24' : '#141417',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        minHeight: 42, cursor: 'grab',
        transition: 'background 0.2s ease',
      }}
    >
      {/* macOS-style traffic lights */}
      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
        <TrafficLight color="#FF5F57" hoverColor="#FF3B30" onClick={e => { e.stopPropagation(); onClose() }} title="Close"/>
        <TrafficLight color="#FEBC2E" hoverColor="#FFA400" onClick={e => { e.stopPropagation() }} title="Minimize"/>
        <TrafficLight color="#28C840" hoverColor="#00B800" onClick={e => { e.stopPropagation() }} title="Maximize"/>
      </div>

      {/* Nav controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 1, marginLeft: 4, flexShrink: 0 }}>
        <NavBtn onClick={e => { e.stopPropagation(); onBack()    }} title="Back"   icon="←"/>
        <NavBtn onClick={e => { e.stopPropagation(); onForward() }} title="Forward" icon="→"/>
        <NavBtn
          onClick={e => { e.stopPropagation(); onReload() }}
          title={isLoading ? 'Stop' : 'Reload'}
          icon={isLoading ? '✕' : '↺'}
          spinning={isLoading}
        />
      </div>

      {/* Favicon */}
      <div style={{ flexShrink: 0, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {favicon
          ? <img src={favicon} style={{ width: 14, height: 14, borderRadius: 3 }} onError={e => e.target.style.display = 'none'}/>
          : <span style={{ fontSize: 12, color: '#3A3750' }}>🌐</span>
        }
      </div>

      {/* URL bar */}
      <div
        className="flex-1 min-w-0"
        style={{ cursor: 'text', flex: 1, minWidth: 0 }}
        onClick={e => { e.stopPropagation(); startEditing() }}
      >
        {editingUrl ? (
          <input
            ref={inputRef}
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onBlur={commitUrl}
            onKeyDown={onKeyDown}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', padding: '4px 10px', borderRadius: 7, outline: 'none',
              fontFamily: "'JetBrains Mono', 'Consolas', monospace",
              fontSize: 11, color: '#E8E6F0',
              background: 'rgba(255,255,255,0.07)',
              border: '1.5px solid rgba(139,92,246,0.45)',
              boxShadow: '0 0 0 3px rgba(139,92,246,0.1)',
            }}
            autoFocus
          />
        ) : (
          <div
            style={{
              padding: '4px 10px', borderRadius: 7,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.05)',
              fontSize: 12, color: '#5C5970',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              transition: 'background 0.15s',
            }}
            title={url}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          >
            {title && title !== displayUrl
              ? <><span style={{ color: '#9C99AC', fontWeight: 500 }}>{title}</span><span style={{ color: '#3A3750', marginLeft: 6, fontSize: 11 }}>{displayUrl}</span></>
              : <span style={{ color: '#6B6880' }}>{displayUrl}</span>
            }
          </div>
        )}
      </div>
    </div>
  )
})

function TrafficLight({ color, hoverColor, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 12, height: 12, borderRadius: '50%',
        background: color, border: 'none', cursor: 'pointer', padding: 0,
        flexShrink: 0, transition: 'filter 0.15s, transform 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.15)'; e.currentTarget.style.transform = 'scale(1.1)' }}
      onMouseLeave={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = '' }}
    />
  )
}

function NavBtn({ onClick, title, icon }) {
  return (
    <button
      onClick={onClick} title={title}
      style={{
        width: 26, height: 26, borderRadius: 7,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: '#3A3750', fontSize: 13, transition: 'all 0.12s', fontFamily: 'inherit',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#9C99AC' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3A3750' }}
    >
      {icon}
    </button>
  )
}

export default WebNodeHeader
