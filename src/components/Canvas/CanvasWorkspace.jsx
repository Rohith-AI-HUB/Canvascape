import { useCallback, useEffect } from 'react'
import ReactFlow, { Background, MiniMap, ReactFlowProvider, useReactFlow, BackgroundVariant } from 'reactflow'
import 'reactflow/dist/style.css'
import { useWorkspaceStore } from '../../store/workspaceStore'
import WebNode           from '../Nodes/WebNode'
import IDENode           from '../Nodes/IDENode'
import GroupFrame        from '../Groups/GroupFrame'
import CanvasContextMenu from './CanvasContextMenu'
import WorkspaceToolbar  from '../UI/WorkspaceToolbar'
import { useContextMenu } from '../../hooks/useContextMenu'
import AICanvasNode from '../AI/AICanvasNode'

const NODE_TYPES = { webNode: WebNode, ideNode: IDENode, groupFrame: GroupFrame, aiNode: AICanvasNode }

function CanvasInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, viewport, setViewport,
    setActiveNode, activeNodeId, filter, theme } = useWorkspaceStore()
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

  const onMoveEnd     = useCallback((_, vp) => setViewport(vp), [setViewport])
  const onPaneClick   = useCallback(() => { setActiveNode(null); closeMenu() }, [setActiveNode, closeMenu])
  const onPaneCtx     = useCallback((e) => { e.preventDefault(); openMenu({ x: e.clientX, y: e.clientY, type: 'pane' }) }, [openMenu])
  const onNodeCtx     = useCallback((e, n) => { e.preventDefault(); openMenu({ x: e.clientX, y: e.clientY, type: 'node', nodeId: n.id }) }, [openMenu])
  const onNodeClick   = useCallback((_, n) => setActiveNode(n.id), [setActiveNode])

  const displayNodes = filter === 'all' ? nodes : nodes.map(n => {
    if (n.type !== 'webNode') return n
    const cutoff = filter === 'today' ? Date.now() - 86_400_000 : Date.now() - 604_800_000
    const dim = (n.data?.createdAt ?? 0) < cutoff
    return dim ? { ...n, style: { ...n.style, opacity: 0.12, pointerEvents: 'none' } }
               : { ...n, style: { ...n.style, opacity: 1, pointerEvents: 'auto' } }
  })

  const webCount = nodes.filter(n => n.type === 'webNode').length
  const nodeColor = n => n.type === 'groupFrame' ? 'var(--a-bg)' : n.id === activeNodeId ? 'var(--a)' : 'rgba(245,158,11,0.3)'

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
        panOnDrag={[1, 2]} panOnScroll={true} panOnScrollMode="free"
        panOnScrollSpeed={0.6} zoomOnScroll={false} zoomOnPinch={true}
        preventScrolling={true} elevateNodesOnSelect={false}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'var(--canvas)' }}>

        <Background variant={BackgroundVariant.Dots} gap={28} size={1.3} color="var(--dot)"/>
        <MiniMap nodeColor={nodeColor} maskColor="rgba(0,0,0,0.5)"
          style={{ bottom: 16, right: 16, width: 148, height: 90, borderRadius: 12,
            border: '1px solid var(--bd)', background: 'var(--canvas)' }}/>
      </ReactFlow>

      <WorkspaceToolbar/>

      {contextMenu && <CanvasContextMenu x={contextMenu.x} y={contextMenu.y}
        type={contextMenu.type} nodeId={contextMenu.nodeId} onClose={closeMenu}/>}

      {webCount === 0 && <EmptyState/>}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-inner">
        <div className="empty-icon">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <path d="M4 15 Q9 7 15 15 Q21 23 26 15" stroke="var(--a)" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            <circle cx="15" cy="15" r="3" fill="var(--a)" opacity="0.5"/>
          </svg>
        </div>
        <p className="empty-title">Your canvas is empty</p>
        <p className="empty-sub">
          Press <kbd className="empty-kbd">Ctrl+N</kbd> to open your first tab
        </p>
        <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 20, lineHeight: 1.8 }}>
          Drag tabs around · Resize with handles · Right-click for options
        </p>
      </div>
    </div>
  )
}

export default function CanvasWorkspace() {
  return (
    <ReactFlowProvider>
      <div style={{ position: 'absolute', inset: 0 }}>
        <CanvasInner/>
      </div>
    </ReactFlowProvider>
  )
}
