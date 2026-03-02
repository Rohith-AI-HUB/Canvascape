import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useReactFlow } from 'reactflow'

// Lives INSIDE ReactFlowProvider — useReactFlow() is safe
export default function CanvasContextMenu({ x, y, type, nodeId, onClose }) {
  const ref = useRef(null)
  const { addWebNode, addIdeNode, addGroupNode, addWorkspace, removeNode, duplicateNode, togglePin, nodes } = useWorkspaceStore()
  const { screenToFlowPosition } = useReactFlow()

  const node = nodes.find(n => n.id === nodeId)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [onClose])

  const pos = () => screenToFlowPosition({ x, y })

  const paneItems = [
    { label: 'New Website',  icon: '🌐', action: () => { addWebNode({ position: pos() }); onClose() } },
    { label: 'New Live IDE', icon: '[]', action: () => { addIdeNode({ position: pos() }); onClose() } },
    { label: 'New Group',    icon: '🗂',  action: () => { addGroupNode({ position: pos() }); onClose() } },
    { sep: true },
    { label: 'New Workspace', icon: '🏷',  action: () => { addWorkspace('New Workspace'); onClose() } },
  ]

  const nodeItems = [
    { label: node?.data?.pinned ? 'Unpin' : 'Pin to top', icon: '◈', action: () => { togglePin(nodeId); onClose() } },
    { label: 'Duplicate',    icon: '⧉', action: () => { duplicateNode(nodeId); onClose() } },
    { sep: true },
    { label: 'Close card',   icon: '✕', danger: true, action: () => { removeNode(nodeId); onClose() } },
  ]

  const items = type === 'node' ? nodeItems : paneItems

  // Clamp to viewport
  const clampedX = Math.min(x, window.innerWidth  - 180)
  const clampedY = Math.min(y, window.innerHeight - 200)

  return (
    <motion.div ref={ref}
      initial={{ opacity:0, scale:0.93, y:-4 }}
      animate={{ opacity:1, scale:1, y:0 }}
      exit={{ opacity:0, scale:0.93 }}
      transition={{ duration:0.1 }}
      style={{ position:'fixed', left:clampedX, top:clampedY, zIndex:1000, minWidth:168,
               background:'rgba(255,255,255,0.95)', backdropFilter:'blur(20px)',
               borderRadius:12, border:'1px solid rgba(200,189,219,0.5)',
               boxShadow:'0 8px 28px rgba(80,60,140,0.14)', overflow:'hidden',
               fontFamily:'inherit' }}>
      <div style={{ padding:'5px 0' }}>
        {items.map((item, i) =>
          item.sep
            ? <div key={i} style={{ height:1, background:'rgba(200,189,219,0.3)', margin:'4px 0' }}/>
            : <button key={item.label} onClick={item.action}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'7px 14px',
                         fontSize:13, color: item.danger ? '#E05B7A' : '#3D3552',
                         background:'none', border:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'background 0.1s' }}
                onMouseEnter={e=>e.currentTarget.style.background=item.danger?'rgba(224,91,122,0.07)':'rgba(124,111,205,0.07)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <span style={{ fontSize:14, lineHeight:1 }}>{item.icon}</span>
                {item.label}
              </button>
        )}
      </div>
    </motion.div>
  )
}

