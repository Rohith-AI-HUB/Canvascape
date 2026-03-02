import { useCallback, useEffect, useRef } from 'react'
import ReactFlow, {
  Background, MiniMap,
  ReactFlowProvider, useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useWorkspaceStore } from '../../store/workspaceStore'
import WebNode           from '../Nodes/WebNode'
import GroupFrame        from '../Groups/GroupFrame'
import CanvasContextMenu from './CanvasContextMenu'
import WorkspaceToolbar  from '../UI/WorkspaceToolbar'
import { useContextMenu } from '../../hooks/useContextMenu'

const NODE_TYPES = { webNode: WebNode, groupFrame: GroupFrame }

// ─────────────────────────────────────────────────────────────────────────────
// Inner component — lives INSIDE ReactFlowProvider, so useReactFlow() is safe
// ─────────────────────────────────────────────────────────────────────────────
function CanvasInner() {
  const {
    nodes, edges, onNodesChange, onEdgesChange,
    viewport, setViewport, setActiveNode, activeNodeId, filter,
  } = useWorkspaceStore()

  const { contextMenu, openMenu, closeMenu } = useContextMenu()
  const rf = useReactFlow()

  // Bridge: BottomBar sits outside the provider and fires this event to fit view
  useEffect(() => {
    const handler = () => rf.fitView({ padding: 0.15, duration: 500 })
    window.addEventListener('canvas:fitview', handler)
    return () => window.removeEventListener('canvas:fitview', handler)
  }, [rf])

  // Bridge: Sidebar fires this to fly to a specific node
  useEffect(() => {
    const handler = (e) => {
      const { nodeId } = e.detail
      rf.fitView({ nodes: [{ id: nodeId }], duration: 420, padding: 0.3 })
      setActiveNode(nodeId)
    }
    window.addEventListener('canvas:flyto', handler)
    return () => window.removeEventListener('canvas:flyto', handler)
  }, [rf, setActiveNode])

  const onMoveEnd        = useCallback((_, vp) => setViewport(vp), [setViewport])
  const onPaneClick      = useCallback(() => { setActiveNode(null); closeMenu() }, [setActiveNode, closeMenu])
  const onPaneCtxMenu    = useCallback((e) => { e.preventDefault(); openMenu({ x: e.clientX, y: e.clientY, type: 'pane' }) }, [openMenu])
  const onNodeCtxMenu    = useCallback((e, node) => { e.preventDefault(); openMenu({ x: e.clientX, y: e.clientY, type: 'node', nodeId: node.id }) }, [openMenu])
  const onNodeClickCb    = useCallback((_, node) => setActiveNode(node.id), [setActiveNode])

  // Apply time filter — dim nodes outside the window
  const displayNodes = filter === 'all' ? nodes : nodes.map((n) => {
    if (n.type !== 'webNode') return n
    const cutoff = filter === 'today' ? Date.now() - 86_400_000 : Date.now() - 604_800_000
    const dim = (n.data?.createdAt ?? 0) < cutoff
    return dim
      ? { ...n, style: { ...n.style, opacity: 0.2, pointerEvents: 'none' } }
      : { ...n, style: { ...n.style, opacity: 1, pointerEvents: 'auto' } }
  })

  const webCount = nodes.filter(n => n.type === 'webNode').length

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={NODE_TYPES}
        defaultViewport={viewport}
        onMoveEnd={onMoveEnd}
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneCtxMenu}
        onNodeContextMenu={onNodeCtxMenu}
        onNodeClick={onNodeClickCb}
        minZoom={0.06}
        maxZoom={2}
        edgesUpdatable={false}
        edgesFocusable={false}
        nodesConnectable={false}
        selectNodesOnDrag={false}
        panOnDrag={[1, 2]}
        zoomOnScroll
        zoomOnPinch
        preventScrolling
        proOptions={{ hideAttribution: true }}
      >
        <Background variant="dots" gap={26} size={1.3} color="#C8BDDB" style={{ opacity: 0.45 }} />
        <MiniMap
          nodeColor={(n) => n.type === 'groupFrame' ? 'rgba(124,111,205,0.12)' : n.id === activeNodeId ? '#7C6FCD' : '#E4DCFA'}
          maskColor="rgba(245,240,235,0.6)"
          style={{ bottom: 16, right: 16, width: 144, height: 88, borderRadius: 10, border: '1px solid rgba(200,189,219,0.35)' }}
        />
      </ReactFlow>

      {/* WorkspaceToolbar is INSIDE the provider — useReactFlow() works here */}
      <WorkspaceToolbar />

      {/* Context menu */}
      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          nodeId={contextMenu.nodeId}
          onClose={closeMenu}
        />
      )}

      {/* Empty state hint */}
      {webCount === 0 && <EmptyHint />}
    </div>
  )
}

function EmptyHint() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ textAlign: 'center', opacity: 0.5 }}>
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ margin: '0 auto 14px' }}>
          <rect x="8" y="8" width="40" height="40" rx="12" stroke="#C8BDDB" strokeWidth="1.5" strokeDasharray="4 3"/>
          <path d="M14 28 Q21 16 28 28 Q35 40 42 28" stroke="#C8BDDB" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </svg>
        <p style={{ color: '#B8ADCC', fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Canvas is empty</p>
        <p style={{ color: '#C8BDDB', fontSize: 13 }}>
          Press <kbd style={{ background: 'rgba(200,189,219,0.25)', border: '1px solid rgba(200,189,219,0.4)', borderRadius: 6, padding: '2px 7px', fontFamily: 'monospace', fontSize: 12 }}>Ctrl+N</kbd> to open a site
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Public export — wraps CanvasInner in ReactFlowProvider
// ─────────────────────────────────────────────────────────────────────────────
export default function CanvasWorkspace() {
  return (
    <ReactFlowProvider>
      <div style={{ position: 'absolute', inset: 0 }}>
        <CanvasInner />
      </div>
    </ReactFlowProvider>
  )
}
