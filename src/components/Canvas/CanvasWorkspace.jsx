import { useCallback, useEffect } from 'react'
import ReactFlow, { Background, useReactFlow, BackgroundVariant } from 'reactflow'
import 'reactflow/dist/style.css'
import { useWorkspaceStore } from '../../store/workspaceStore'
import WebNode           from '../Nodes/WebNode'
import IDENode           from '../Nodes/IDENode'
import GroupFrame        from '../Groups/GroupFrame'
import CanvasContextMenu from './CanvasContextMenu'
import { useContextMenu } from '../../hooks/useContextMenu'
import AICanvasNode from '../AI/AICanvasNode'
import { normalizeUrl, titleFromUrl, faviconUrl } from '../../utils/urlUtils'

const NODE_TYPES = { webNode: WebNode, ideNode: IDENode, groupFrame: GroupFrame, aiNode: AICanvasNode }

function CanvasInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, viewport, setViewport,
    setActiveNode, activeNodeId, filter, activeCategoryId, addWebNode } = useWorkspaceStore()
  const { contextMenu, openMenu, closeMenu } = useContextMenu()
  const rf = useReactFlow()

  useEffect(() => {
    const h = () => rf.fitView({ padding: 0.15, duration: 500 })
    window.addEventListener('canvas:fitview', h)
    return () => window.removeEventListener('canvas:fitview', h)
  }, [rf])

  useEffect(() => {
    const h = (e) => { rf.fitView({ nodes: [{ id: e.detail.nodeId }], duration: 420, padding: 0.3 }); setActiveNode(e.detail.nodeId) }
    window.addEventListener('canvas:flyto', h)
    return () => window.removeEventListener('canvas:flyto', h)
  }, [rf, setActiveNode])

  // Open URL fired by webview right-click "Open Link in New Tab"
  useEffect(() => {
    const h = (e) => {
      const url = e.detail?.url
      if (!url) return
      addWebNode({ url: normalizeUrl(url), title: titleFromUrl(url), favicon: faviconUrl(url),
        position: { x: 200 + Math.random() * 280, y: 100 + Math.random() * 180 },
        categoryId: activeCategoryId })
    }
    window.addEventListener('canvas:openurl', h)
    return () => window.removeEventListener('canvas:openurl', h)
  }, [addWebNode, activeCategoryId])

  const onMoveEnd   = useCallback((_, vp) => setViewport(vp), [setViewport])
  const onPaneClick = useCallback(() => { setActiveNode(null); closeMenu() }, [setActiveNode, closeMenu])
  const onPaneCtx   = useCallback((e) => { e.preventDefault(); openMenu({ x: e.clientX, y: e.clientY, type: 'pane' }) }, [openMenu])
  const onNodeCtx   = useCallback((e, n) => { e.preventDefault(); openMenu({ x: e.clientX, y: e.clientY, type: 'node', nodeId: n.id }) }, [openMenu])
  const onNodeClick = useCallback((_, n) => setActiveNode(n.id), [setActiveNode])

  const displayNodes = nodes
    .filter(n => {
      if (n.type === 'webNode') {
        return n.data?.categoryId === activeCategoryId || (!activeCategoryId && !n.data?.categoryId)
      }
      return true
    })
    .map(n => {
      if (n.type !== 'webNode') return n
      const cutoff = filter === 'today' ? Date.now() - 86_400_000 : Date.now() - 604_800_000
      const dim = filter !== 'all' && (n.data?.createdAt ?? 0) < cutoff
      return dim ? { ...n, style: { ...n.style, opacity: 0.12, pointerEvents: 'none' } }
                : { ...n, style: { ...n.style, opacity: 1, pointerEvents: 'auto' } }
    })

  const webCount = nodes.filter(n => n.type === 'webNode').length

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--canvas)' }}>
      <ReactFlow
        nodes={displayNodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        nodeTypes={NODE_TYPES} defaultViewport={viewport}
        onMoveEnd={onMoveEnd} onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneCtx} onNodeContextMenu={onNodeCtx} onNodeClick={onNodeClick}
        minZoom={0.06} maxZoom={2}
        edgesUpdatable={false} edgesFocusable={false}
        nodesConnectable={false} selectNodesOnDrag={false}
        panOnDrag={[1, 2]}
        panOnScroll={true}
        panOnScrollMode="free"
        panOnScrollSpeed={0.6}
        zoomOnScroll={false}
        zoomOnPinch={true}
        zoomActivationKeyCode="Control"
        preventScrolling={true}
        elevateNodesOnSelect={false}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'var(--canvas)' }}>

        <Background variant={BackgroundVariant.Dots} gap={28} size={1.3} color="var(--dot)"/>
      </ReactFlow>

      {contextMenu && <CanvasContextMenu x={contextMenu.x} y={contextMenu.y}
        type={contextMenu.type} nodeId={contextMenu.nodeId} onClose={closeMenu}/>}
    </div>
  )
}

export default function CanvasWorkspace() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <CanvasInner/>
    </div>
  )
}
