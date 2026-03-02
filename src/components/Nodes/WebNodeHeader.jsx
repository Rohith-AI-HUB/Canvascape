import { useState, useRef, useCallback, memo } from 'react'

const WebNodeHeader = memo(function WebNodeHeader({
  id, title, url, favicon, isLoading, isActive,
  onNavigate, onClose, onBack, onForward, onReload,
}) {
  const [editingUrl, setEditingUrl] = useState(false)
  const [urlInput, setUrlInput] = useState('')
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
    if (e.key === 'Enter') commitUrl()
    if (e.key === 'Escape') setEditingUrl(false)
    e.stopPropagation()
  }

  const displayUrl = (() => {
    try {
      const u = new URL(url)
      const p = u.pathname !== '/' ? u.pathname.slice(0, 24) + (u.pathname.length > 24 ? '…' : '') : ''
      return u.hostname + p
    } catch { return url || '' }
  })()

  return (
    <div
      className="node-drag-handle flex items-center gap-1.5 px-2.5 py-2 select-none"
      style={{
        background: isActive ? '#F8F5FF' : '#FDFCFF',
        borderBottom: '1px solid rgba(200,189,219,0.35)',
        minHeight: 44,
        cursor: 'grab',
      }}
    >
      {/* Close button */}
      <button
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ background: '#F9A8B8', border: '1px solid rgba(0,0,0,0.06)' }}
        onClick={(e) => { e.stopPropagation(); onClose() }}
        title="Close"
      />

      {/* Nav controls */}
      <div className="flex items-center gap-0.5 ml-1 flex-shrink-0">
        <NavBtn onClick={(e) => { e.stopPropagation(); onBack() }} title="Back">←</NavBtn>
        <NavBtn onClick={(e) => { e.stopPropagation(); onForward() }} title="Forward">→</NavBtn>
        <NavBtn onClick={(e) => { e.stopPropagation(); onReload() }} title="Reload">{isLoading ? '✕' : '↺'}</NavBtn>
      </div>

      {/* Favicon */}
      {favicon ? (
        <img src={favicon} className="w-4 h-4 rounded flex-shrink-0 ml-1" onError={(e) => { e.target.style.display = 'none' }} />
      ) : (
        <span className="w-4 h-4 flex-shrink-0 ml-1 text-xs flex items-center justify-center" style={{ color: '#C8BDDB' }}>🌐</span>
      )}

      {/* URL bar */}
      <div className="flex-1 min-w-0 cursor-text" onClick={(e) => { e.stopPropagation(); startEditing() }}>
        {editingUrl ? (
          <input
            ref={inputRef}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onBlur={commitUrl}
            onKeyDown={onKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-xs px-2 py-1 rounded-md outline-none"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, color: '#3D3552',
              background: 'rgba(124,111,205,0.08)',
              border: '1.5px solid rgba(124,111,205,0.3)',
            }}
            autoFocus
          />
        ) : (
          <div className="px-2 py-1 rounded-md truncate" style={{ color: '#9B91B8', fontSize: 12 }} title={url}>
            {title && title !== displayUrl ? (
              <span style={{ color: '#3D3552', fontWeight: 500 }}>{title}</span>
            ) : displayUrl}
          </div>
        )}
      </div>
    </div>
  )
})

function NavBtn({ onClick, title, children }) {
  return (
    <button
      onClick={onClick} title={title}
      className="w-6 h-6 rounded-md flex items-center justify-center text-sm"
      style={{ color: '#B8ADCC' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,111,205,0.1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

export default WebNodeHeader
