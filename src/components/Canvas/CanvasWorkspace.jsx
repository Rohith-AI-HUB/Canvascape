import { useCallback, useEffect, useMemo } from 'react'
import ReactFlow, { Background, useReactFlow, BackgroundVariant } from 'reactflow'
import 'reactflow/dist/style.css'
import { useWorkspaceStore, ACTIVATION_RADIUS, FADE_RADIUS } from '../../store/workspaceStore'
import WebNode from '../Nodes/WebNode'
import IDENode from '../Nodes/IDENode'
import GroupFrame from '../Groups/GroupFrame'
import CanvasContextMenu from './CanvasContextMenu'
import { useContextMenu } from '../../hooks/useContextMenu'
import AICanvasNode from '../AI/AICanvasNode'
import SettingsNode from '../Nodes/SettingsNode'
import { normalizeUrl, titleFromUrl, faviconUrl } from '../../utils/urlUtils'

const NODE_TYPES = {
  webNode: WebNode,
  ideNode: IDENode,
  groupFrame: GroupFrame,
  aiNode: AICanvasNode,
  settingsNode: SettingsNode,
}

function dist(a, b) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function nodeCenter(n) {
  const w = n.style?.width ?? 400
  const h = n.style?.height ?? 300
  return { x: (n.position?.x ?? 0) + w / 2, y: (n.position?.y ?? 0) + h / 2 }
}

function hasCustomViewport(vp) {
  if (
    !vp ||
    !Number.isFinite(vp.x) ||
    !Number.isFinite(vp.y) ||
    !Number.isFinite(vp.zoom)
  ) return false

  return vp.x !== 0 || vp.y !== 0 || vp.zoom !== 1
}

function CanvasInner() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    getActiveWorkspace,
    setViewport,
    setActiveNode,
    activeWorkspaceId,
    activeNodeId,
    filter,
    addWebNode,
    viewportCenter,
  } = useWorkspaceStore()

  const { contextMenu, openMenu, closeMenu } = useContextMenu()
  const rf = useReactFlow()
  const activeWorkspace = getActiveWorkspace()

  // On workspace switch, prefer saved viewport, otherwise fit to workspace cluster.
  useEffect(() => {
    if (!rf) return

    const savedViewport = activeWorkspace?.viewport
    if (hasCustomViewport(savedViewport)) {
      rf.setViewport(savedViewport, { duration: 600 })
      return
    }

    const wsNodes = nodes
      .filter((n) => n.data?.workspaceId === activeWorkspaceId)
      .map((n) => ({ id: n.id }))

    if (wsNodes.length > 0) {
      rf.fitView({ nodes: wsNodes, duration: 600, padding: 0.28 })
      return
    }

    rf.setViewport({ x: 0, y: 0, zoom: 0.9 }, { duration: 600 })
  }, [activeWorkspaceId, activeWorkspace?.viewport, nodes, rf])

  useEffect(() => {
    const h = () => rf.fitView({ padding: 0.15, duration: 500 })
    window.addEventListener('canvas:fitview', h)
    return () => window.removeEventListener('canvas:fitview', h)
  }, [rf])

  useEffect(() => {
    const h = (e) => {
      rf.fitView({ nodes: [{ id: e.detail.nodeId }], duration: 420, padding: 0.3 })
      setActiveNode(e.detail.nodeId)
    }
    window.addEventListener('canvas:flyto', h)
    return () => window.removeEventListener('canvas:flyto', h)
  }, [rf, setActiveNode])

  useEffect(() => {
    const h = (e) => {
      const url = e.detail?.url
      if (!url) return
      addWebNode({
        url: normalizeUrl(url),
        title: titleFromUrl(url),
        favicon: faviconUrl(url),
        workspaceId: activeWorkspaceId,
      })
    }
    window.addEventListener('canvas:openurl', h)
    return () => window.removeEventListener('canvas:openurl', h)
  }, [addWebNode, activeWorkspaceId])

  const onMoveEnd = useCallback((_, vp) => setViewport(vp), [setViewport])
  const onPaneClick = useCallback(() => {
    setActiveNode(null)
    closeMenu()
  }, [setActiveNode, closeMenu])
  const onPaneCtx = useCallback((e) => {
    e.preventDefault()
    openMenu({ x: e.clientX, y: e.clientY, type: 'pane' })
  }, [openMenu])
  const onNodeCtx = useCallback((e, n) => {
    e.preventDefault()
    openMenu({ x: e.clientX, y: e.clientY, type: 'node', nodeId: n.id })
  }, [openMenu])
  const onNodeClick = useCallback((_, n) => setActiveNode(n.id), [setActiveNode])

  const focusCenter = useMemo(() => {
    if (activeNodeId) {
      const activeNode = nodes.find((n) => n.id === activeNodeId)
      if (activeNode) return nodeCenter(activeNode)
    }
    return viewportCenter
  }, [activeNodeId, nodes, viewportCenter])

  const displayNodes = useMemo(() => {
    return nodes.map((n) => {
      if (n.type === 'settingsNode') {
        return { ...n, style: { ...n.style, opacity: 1, pointerEvents: 'auto' } }
      }

      const center = nodeCenter(n)
      const d = dist(center, focusCenter)

      let opacity = 1
      let pointerEvents = 'auto'

      if (d > FADE_RADIUS) {
        opacity = 0.12
        pointerEvents = 'none'
      } else if (d > ACTIVATION_RADIUS) {
        const t = (d - ACTIVATION_RADIUS) / (FADE_RADIUS - ACTIVATION_RADIUS)
        opacity = 1 - t * 0.88
      }

      if (n.type === 'webNode' && filter !== 'all') {
        const cutoff = filter === 'today' ? Date.now() - 86_400_000 : Date.now() - 604_800_000
        if ((n.data?.createdAt ?? 0) < cutoff) {
          opacity = Math.min(opacity, 0.12)
          pointerEvents = 'none'
        }
      }

      return {
        ...n,
        style: { ...n.style, opacity, pointerEvents, transition: 'opacity 0.3s ease' },
      }
    })
  }, [nodes, focusCenter, filter])

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--canvas)' }}>
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={NODE_TYPES}
        defaultViewport={activeWorkspace?.viewport || { x: 0, y: 0, zoom: 1 }}
        onMoveEnd={onMoveEnd}
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneCtx}
        onNodeContextMenu={onNodeCtx}
        onNodeClick={onNodeClick}
        minZoom={0.02}
        maxZoom={2}
        edgesUpdatable={false}
        edgesFocusable={false}
        nodesConnectable={false}
        selectNodesOnDrag={false}
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
        style={{ background: 'var(--canvas)' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1.3} color="var(--dot)" />
      </ReactFlow>

      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          nodeId={contextMenu.nodeId}
          onClose={closeMenu}
        />
      )}
    </div>
  )
}

export default function CanvasWorkspace() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <CanvasInner />
    </div>
  )
}
