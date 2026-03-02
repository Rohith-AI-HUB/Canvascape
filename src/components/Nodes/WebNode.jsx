import { memo, useRef, useCallback, useEffect } from 'react'
import { NodeResizer } from 'reactflow'
import { motion } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { normalizeUrl, titleFromUrl, faviconUrl } from '../../utils/urlUtils'
import WebNodeHeader from './WebNodeHeader'

const WebNode = memo(function WebNode({ id, data }) {
  const { updateNodeData, removeNode, setActiveNode, resizeNode, activeNodeId, toggleMinimize, theme } = useWorkspaceStore()
  const webviewRef  = useRef(null)
  const isActive    = activeNodeId === id
  const isMinimized = data?.minimized ?? false
  const isDark      = theme === 'dark'

  // Set src ONCE on mount — never via JSX prop (avoids page reload on re-render)
  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return
    wv.src = normalizeUrl(data.url)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return
    const onTitle   = (e) => updateNodeData(id, { title: e.title, isLoading: false })
    const onFavicon = (e) => { if (e.favicons?.length > 0) updateNodeData(id, { favicon: e.favicons[0] }) }
    const onStart   = () => updateNodeData(id, { isLoading: true })
    const onStop    = () => updateNodeData(id, { isLoading: false })
    const onNav     = (e) => updateNodeData(id, { url: e.url })
    const onFail    = (e) => { if (e.errorCode === -3) return; updateNodeData(id, { isLoading: false }) }
    wv.addEventListener('page-title-updated', onTitle)
    wv.addEventListener('page-favicon-updated', onFavicon)
    wv.addEventListener('did-start-loading', onStart)
    wv.addEventListener('did-stop-loading', onStop)
    wv.addEventListener('did-navigate', onNav)
    wv.addEventListener('did-navigate-in-page', onNav)
    wv.addEventListener('did-fail-load', onFail)
    return () => {
      wv.removeEventListener('page-title-updated', onTitle)
      wv.removeEventListener('page-favicon-updated', onFavicon)
      wv.removeEventListener('did-start-loading', onStart)
      wv.removeEventListener('did-stop-loading', onStop)
      wv.removeEventListener('did-navigate', onNav)
      wv.removeEventListener('did-navigate-in-page', onNav)
      wv.removeEventListener('did-fail-load', onFail)
    }
  }, [id, updateNodeData])

  const navigateTo  = useCallback((rawUrl) => {
    const url = normalizeUrl(rawUrl)
    updateNodeData(id, { url, title: titleFromUrl(url), favicon: faviconUrl(url) })
    if (webviewRef.current) webviewRef.current.src = url
  }, [id, updateNodeData])

  const goBack      = useCallback(() => webviewRef.current?.goBack(), [])
  const goForward   = useCallback(() => webviewRef.current?.goForward(), [])
  const reload      = useCallback(() => webviewRef.current?.reload(), [])
  const onMinimize  = useCallback(() => toggleMinimize(id), [id, toggleMinimize])
  const onResizeEnd = useCallback((_, p) => resizeNode(id, p.width, p.height), [id, resizeNode])
  const bringFront  = useCallback(() => setActiveNode(id), [id, setActiveNode])

  const hostname = (() => { try { return new URL(data.url).hostname.replace('www.', '') } catch { return '' } })()

  return (
    <div style={{ width: '100%', height: '100%' }} onMouseDown={bringFront}>

      {/* ── MINIMIZED — compact dock tile ── */}
      {isMinimized && (
        <motion.div className="node-drag-handle"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          onDoubleClick={() => toggleMinimize(id)}
          style={{
            position: 'absolute', inset: 0, zIndex: 2,
            borderRadius: 14, overflow: 'hidden',
            background: isDark ? '#1A1916' : '#FFFFFF',
            border: isActive ? '1.5px solid var(--bd-a)' : `1px solid ${isDark ? 'rgba(255,245,220,0.09)' : 'rgba(100,80,40,0.12)'}`,
            boxShadow: isActive ? '0 0 0 3px var(--a-bg), 0 8px 32px rgba(0,0,0,0.5)' : 'var(--sh-card)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10,
            cursor: 'grab', userSelect: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}>

          {/* Top dots */}
          <div style={{ position: 'absolute', top: 9, left: 9, display: 'flex', gap: 5 }}>
            <Dot color="#FF5F57" title="Close"   onClick={e => { e.stopPropagation(); removeNode(id) }}/>
            <Dot color="#FEBC2E" title="Restore" onClick={e => { e.stopPropagation(); toggleMinimize(id) }}/>
          </div>

          {/* Site icon */}
          <div style={{
            width: 54, height: 54, borderRadius: 14, flexShrink: 0,
            background: isDark ? 'rgba(255,245,220,0.05)' : 'rgba(100,80,40,0.05)',
            border: `1px solid ${isDark ? 'rgba(255,245,220,0.08)' : 'rgba(100,80,40,0.1)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            {data.favicon
              ? <img src={data.favicon} style={{ width: 30, height: 30, borderRadius: 7 }} onError={e => e.target.style.display = 'none'}/>
              : <GlobeIcon isDark={isDark} size={24}/>
            }
          </div>

          {/* Title + domain */}
          <div style={{ textAlign: 'center', padding: '0 12px', width: '100%' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#F5F0E8' : '#1A1712', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>
              {data.title || 'Untitled'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Mono', monospace" }}>
              {hostname}
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: 7, fontSize: 9, color: 'var(--t4)', letterSpacing: '0.03em', fontFamily: "'DM Sans', sans-serif" }}>
            double-click to restore
          </div>
        </motion.div>
      )}

      {/* ── FULL CARD — always mounted so webview never reloads ── */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        borderRadius: 14, overflow: 'hidden',
        background: isDark ? '#141310' : '#FFFFFF',
        boxShadow: isActive ? 'var(--sh-active)' : 'var(--sh-card)',
        // visibility not display — keeps webview alive
        visibility: isMinimized ? 'hidden' : 'visible',
        transition: 'box-shadow 0.2s ease',
      }}>
        <NodeResizer
          minWidth={340} minHeight={260}
          isVisible={isActive && !isMinimized}
          onResizeEnd={onResizeEnd}
          lineStyle={{ borderColor: 'var(--a)' }}
          handleStyle={{ width: 9, height: 9, background: 'var(--a)', border: '2px solid var(--s1)', borderRadius: '50%', boxShadow: '0 0 8px var(--a-glow)' }}
        />
        <WebNodeHeader
          id={id} title={data.title} url={data.url}
          favicon={data.favicon} isLoading={data.isLoading} isActive={isActive}
          onNavigate={navigateTo} onClose={() => removeNode(id)}
          onBack={goBack} onForward={goForward} onReload={reload}
          onMinimize={onMinimize} theme={theme}
        />
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {data.isLoading && <ProgressBar />}
          {/* No src prop — set imperatively once in useEffect */}
          <webview ref={webviewRef} style={{ width: '100%', height: '100%' }}
            partition="persist:canvascape"
            webpreferences="allowRunningInsecureContent=false, javascript=yes, images=yes"/>
        </div>
      </div>
    </div>
  )
})

function ProgressBar() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, height: 2, background: 'var(--a-bg)' }}>
      <motion.div
        style={{ height: '100%', background: 'linear-gradient(90deg, var(--a-dim), var(--a), var(--a2), var(--a))', backgroundSize: '200% 100%', borderRadius: 999 }}
        initial={{ width: '0%', backgroundPosition: '0% 0%' }}
        animate={{ width: '90%', backgroundPosition: '200% 0%' }}
        transition={{ width: { duration: 2.5, ease: 'easeOut' }, backgroundPosition: { duration: 1.4, repeat: Infinity, ease: 'linear' } }}
      />
    </div>
  )
}

function Dot({ color, onClick, title }) {
  return (
    <div onClick={onClick} title={title}
      style={{ width: 11, height: 11, borderRadius: '50%', background: color, cursor: 'pointer', flexShrink: 0, transition: 'transform 0.1s, filter 0.1s', boxShadow: `0 1px 3px ${color}60` }}
      onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.15)'; e.currentTarget.style.transform = 'scale(1.1)' }}
      onMouseLeave={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = '' }}
    />
  )
}

function GlobeIcon({ isDark, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={isDark ? '#3A3830' : '#C8C0A0'} strokeWidth="1.5"/>
      <path d="M3 12h18M12 3c-3 3-3 12 0 18M12 3c3 3 3 12 0 18" stroke={isDark ? '#3A3830' : '#C8C0A0'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export default WebNode
