import { memo, useRef, useState, useCallback, useEffect } from 'react'
import { NodeResizer } from 'reactflow'
import { motion } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { normalizeUrl, titleFromUrl, faviconUrl } from '../../utils/urlUtils'
import WebNodeHeader from './WebNodeHeader'

const WebNode = memo(function WebNode({ id, data, selected }) {
  const { updateNodeData, removeNode, setActiveNode, resizeNode, activeNodeId } = useWorkspaceStore()
  const webviewRef = useRef(null)
  const isActive = activeNodeId === id

  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return
    const onTitle = (e) => updateNodeData(id, { title: e.title, isLoading: false })
    const onFavicon = (e) => { if (e.favicons?.length > 0) updateNodeData(id, { favicon: e.favicons[0] }) }
    const onStart = () => updateNodeData(id, { isLoading: true })
    const onStop = () => updateNodeData(id, { isLoading: false })
    const onNav = (e) => updateNodeData(id, { url: e.url })

    wv.addEventListener('page-title-updated', onTitle)
    wv.addEventListener('page-favicon-updated', onFavicon)
    wv.addEventListener('did-start-loading', onStart)
    wv.addEventListener('did-stop-loading', onStop)
    wv.addEventListener('did-navigate', onNav)
    wv.addEventListener('did-navigate-in-page', onNav)

    return () => {
      wv.removeEventListener('page-title-updated', onTitle)
      wv.removeEventListener('page-favicon-updated', onFavicon)
      wv.removeEventListener('did-start-loading', onStart)
      wv.removeEventListener('did-stop-loading', onStop)
      wv.removeEventListener('did-navigate', onNav)
      wv.removeEventListener('did-navigate-in-page', onNav)
    }
  }, [id, updateNodeData])

  const navigateTo = useCallback((rawUrl) => {
    const url = normalizeUrl(rawUrl)
    updateNodeData(id, { url, title: titleFromUrl(url), favicon: faviconUrl(url) })
    if (webviewRef.current) webviewRef.current.src = url
  }, [id, updateNodeData])

  const goBack = useCallback(() => webviewRef.current?.goBack(), [])
  const goForward = useCallback(() => webviewRef.current?.goForward(), [])
  const reload = useCallback(() => webviewRef.current?.reload(), [])

  const onResizeEnd = useCallback((_, params) => {
    resizeNode(id, params.width, params.height)
  }, [id, resizeNode])

  return (
    <motion.div
      className="web-node h-full w-full flex flex-col"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => setActiveNode(id)}
      style={{
        borderRadius: 16,
        background: '#FFFFFF',
        boxShadow: isActive
          ? '0 8px 40px rgba(120,100,180,0.20), 0 2px 8px rgba(120,100,180,0.12)'
          : '0 4px 24px rgba(120,100,180,0.10), 0 1px 4px rgba(120,100,180,0.08)',
        border: isActive
          ? '1.5px solid rgba(124,111,205,0.45)'
          : '1.5px solid rgba(200,189,219,0.4)',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      }}
    >
      <NodeResizer
        minWidth={320} minHeight={240}
        isVisible={isActive}
        onResizeEnd={onResizeEnd}
        lineStyle={{ borderColor: 'rgba(124,111,205,0.4)' }}
        handleStyle={{ width: 8, height: 8, background: '#7C6FCD', border: '2px solid white', borderRadius: '50%' }}
      />

      <WebNodeHeader
        id={id} title={data.title} url={data.url}
        favicon={data.favicon} isLoading={data.isLoading} isActive={isActive}
        onNavigate={navigateTo} onClose={() => removeNode(id)}
        onBack={goBack} onForward={goForward} onReload={reload}
      />

      <div className="flex-1 relative overflow-hidden" style={{ borderRadius: '0 0 14px 14px' }}>
        {data.isLoading && <LoadingBar />}
        <webview
          ref={webviewRef}
          src={normalizeUrl(data.url)}
          style={{ width: '100%', height: '100%' }}
          partition="persist:canvascape"
          allowpopups="false"
        />
      </div>
    </motion.div>
  )
})

function LoadingBar() {
  return (
    <div className="absolute top-0 left-0 right-0 z-10" style={{ height: 2, background: 'rgba(200,189,219,0.3)' }}>
      <motion.div
        style={{ height: '100%', background: 'linear-gradient(90deg, #7C6FCD, #B8ADEA)', borderRadius: 999 }}
        initial={{ width: '0%' }}
        animate={{ width: '85%' }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
      />
    </div>
  )
}

export default WebNode
