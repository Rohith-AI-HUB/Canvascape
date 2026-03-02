import { useCallback, useEffect } from 'react'
import ReactFlow, {
  Background, MiniMap,
  ReactFlowProvider, useReactFlow,
  BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useWorkspaceStore } from '../../store/workspaceStore'
import WebNode           from '../Nodes/WebNode'
import GroupFrame        from '../Groups/GroupFrame'
import CanvasContextMenu from './CanvasContextMenu'
import WorkspaceToolbar  from '../UI/WorkspaceToolbar'
import { useContextMenu } from '../../hooks/useContextMenu'

const NODE_TYPES = { webNode: WebNode, groupFrame: GroupFrame }

function CanvasInner() {
  const {
    nodes, edges, onNodesChange, onEdgesChange,
    viewport, setViewport, setActiveNode, activeNodeId, filter,
  } = useWorkspaceStore()

  const { contextMenu, openMenu, closeMenu } = useContextMenu()
  const rf = useReactFlow()

  useEffect(() => {
    const handler = () => rf.fitView({ padding: 0.15, duration: 500 })
    window.addEventListener('canvas:fitview', handler)
    return () => window.removeEventListener('canvas:fitview', handler)
  }, [rf])

  useEffect(() => {
    const handler = (e) => {
      const { nodeId } = e.detail
      rf.fitView({ nodes: [{ id: nodeId }], duration: 420, padding: 0.3 })
      setActiveNode(nodeId)
    }
    window.addEventListener('canvas:flyto', handler)
    return () => window.removeEventListener('canvas:flyto', handler)
  }, [rf, setActiveNode])

  const onMoveEnd     = useCallback((_, vp) => setViewport(vp), [setViewport])
  const onPaneClick   = useCallback(() => { setActiveNode(null); closeMenu() }, [setActiveNode, closeMenu])
  const onPaneCtxMenu = useCallback((e) => { e.preventDefault(); openMenu({ x: e.clientX, y: e.clientY, type: 'pane' }) }, [openMenu])
  const onNodeCtxMenu = useCallback((e, node) => { e.preventDefault(); openMenu({ x: e.clientX, y: e.clientY, type: 'node', nodeId: node.id }) }, [openMenu])
  const onNodeClickCb = useCallback((_, node) => setActiveNode(node.id), [setActiveNode])

  const displayNodes = filter === 'all' ? nodes : nodes.map((n) => {
    if (n.type !== 'webNode') return n
    const cutoff = filter === 'today' ? Date.now() - 86_400_000 : Date.now() - 604_800_000
    const dim = (n.data?.createdAt ?? 0) < cutoff
    return dim
      ? { ...n, style: { ...n.style, opacity: 0.15, pointerEvents: 'none' } }
      : { ...n, style: { ...n.style, opacity: 1, pointerEvents: 'auto' } }
  })

  const webCount = nodes.filter(n => n.type === 'webNode').length

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0E0E12' }}>
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
        style={{ background: '#0E0E12' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1.2}
          color="rgba(255,255,255,0.07)"
        />
        <MiniMap
          nodeColor={(n) => n.type === 'groupFrame'
            ? 'rgba(139,92,246,0.1)'
            : n.id === activeNodeId ? '#8B5CF6' : 'rgba(139,92,246,0.35)'}
          maskColor="rgba(14,14,18,0.75)"
          style={{
            bottom: 16, right: 16, width: 140, height: 84,
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.07)',
            background: '#14141A',
          }}
        />
      </ReactFlow>

      <WorkspaceToolbar />

      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.x} y={contextMenu.y}
          type={contextMenu.type} nodeId={contextMenu.nodeId}
          onClose={closeMenu}
        />
      )}

      {webCount === 0 && <EmptyHint />}
    </div>
  )
}

function EmptyHint() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ textAlign: 'center' }}>
        {/* Animated logo */}
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }}>
          <circle cx="26" cy="26" r="22" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" strokeDasharray="5 4"/>
          <path d="M12 26 Q18 14 26 26 Q34 38 40 26" stroke="rgba(139,92,246,0.8)" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </svg>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 500, marginBottom: 8, letterSpacing: '-0.01em' }}>
          Canvas is empty
        </p>
        <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 13 }}>
          Press{' '}
          <kbd style={{
            background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
            borderRadius: 6, padding: '2px 7px', fontFamily: 'Geist Mono, monospace', fontSize: 12,
            color: 'rgba(196,181,253,0.6)',
          }}>Ctrl+N</kbd>{' '}
          to open a site
        </p>
      </div>
    </div>
  )
}

export default function CanvasWorkspace() {
  return (
    <ReactFlowProvider>
      <div style={{ position: 'absolute', inset: 0 }}>
        <CanvasInner />
      </div>
    </ReactFlowProvider>
  )
}
