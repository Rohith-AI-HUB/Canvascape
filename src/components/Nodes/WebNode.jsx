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

  const navigateTo = useCallback((rawUrl) => {
    const url = normalizeUrl(rawUrl)
    updateNodeData(id, { url, title: titleFromUrl(url), favicon: faviconUrl(url) })
    if (webviewRef.current) webviewRef.current.src = url
  }, [id, updateNodeData])

  const goBack    = useCallback(() => webviewRef.current?.goBack(), [])
  const goForward = useCallback(() => webviewRef.current?.goForward(), [])
  const reload    = useCallback(() => webviewRef.current?.reload(), [])

  const onResizeEnd = useCallback((_, params) => {
    resizeNode(id, params.width, params.height)
  }, [id, resizeNode])

  return (
    <motion.div
      className="web-node h-full w-full flex flex-col"
      initial={{ opacity: 0, scale: 0.94, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => setActiveNode(id)}
      style={{
        borderRadius: 14,
        background: '#141417',
        boxShadow: isActive
          ? '0 0 0 1.5px rgba(123,97,255,0.6), 0 8px 48px rgba(0,0,0,0.7), 0 0 30px rgba(123,97,255,0.15)'
          : '0 0 0 1px rgba(255,255,255,0.07), 0 4px 24px rgba(0,0,0,0.5)',
        border: 'none',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      <NodeResizer
        minWidth={340} minHeight={260}
        isVisible={isActive}
        onResizeEnd={onResizeEnd}
        lineStyle={{ borderColor: 'rgba(123,97,255,0.5)' }}
        handleStyle={{ width: 8, height: 8, background: '#7B61FF', border: '2px solid #1C1C21', borderRadius: '50%', boxShadow: '0 0 8px rgba(123,97,255,0.6)' }}
      />

      <WebNodeHeader
        id={id} title={data.title} url={data.url}
        favicon={data.favicon} isLoading={data.isLoading} isActive={isActive}
        onNavigate={navigateTo} onClose={() => removeNode(id)}
        onBack={goBack} onForward={goForward} onReload={reload}
      />

      <div className="flex-1 relative overflow-hidden" style={{ borderRadius: '0 0 13px 13px' }}>
        {data.isLoading && <LoadingBar />}
        <webview
          ref={webviewRef}
          src={normalizeUrl(data.url)}
          style={{ width: '100%', height: '100%' }}
          partition="persist:canvascape"
        />
      </div>
    </motion.div>
  )
})

function LoadingBar() {
  return (
    <div className="absolute top-0 left-0 right-0 z-10" style={{ height: 2, background: 'rgba(123,97,255,0.1)' }}>
      <motion.div
        style={{ height: '100%', background: 'linear-gradient(90deg, #7B61FF, #A78BFA, #7B61FF)', borderRadius: 999, backgroundSize: '200% 100%' }}
        initial={{ width: '0%', backgroundPosition: '0% 0%' }}
        animate={{ width: '90%', backgroundPosition: '200% 0%' }}
        transition={{ width: { duration: 2.8, ease: 'easeOut' }, backgroundPosition: { duration: 1.5, repeat: Infinity, ease: 'linear' } }}
      />
    </div>
  )
}

export default WebNode
