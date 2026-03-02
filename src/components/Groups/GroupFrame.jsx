import { memo, useState } from 'react'
import { NodeResizer } from 'reactflow'
import { motion } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'

const GROUP_COLORS = [
  { bg: 'rgba(255,214,214,0.35)', border: 'rgba(240,150,170,0.4)', label: '#C05878' },
  { bg: 'rgba(232,214,255,0.35)', border: 'rgba(180,150,230,0.4)', label: '#8048C0' },
  { bg: 'rgba(214,255,232,0.35)', border: 'rgba(100,200,150,0.4)', label: '#287850' },
  { bg: 'rgba(214,238,255,0.35)', border: 'rgba(100,170,220,0.4)', label: '#2858A0' },
  { bg: 'rgba(255,232,214,0.35)', border: 'rgba(220,160,100,0.4)', label: '#A06028' },
]

const GroupFrame = memo(function GroupFrame({ id, data, selected }) {
  const { updateNodeData, removeNode, resizeNode, setActiveNode } = useWorkspaceStore()
  const [editingLabel, setEditingLabel] = useState(false)
  const [labelInput, setLabelInput] = useState(data.label || 'Group')
  const color = GROUP_COLORS[(data.colorIdx ?? 1) % GROUP_COLORS.length]

  const commitLabel = () => { setEditingLabel(false); updateNodeData(id, { label: labelInput }) }

  return (
    <motion.div
      className="group-frame w-full h-full relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: color.bg, border: `2px dashed ${color.border}`, borderRadius: 20 }}
      onClick={() => setActiveNode(id)}
    >
      <NodeResizer
        minWidth={300} minHeight={200} isVisible={selected}
        onResizeEnd={(_, p) => resizeNode(id, p.width, p.height)}
        lineStyle={{ borderColor: color.border }}
        handleStyle={{ background: color.label, borderRadius: '50%', border: '2px solid white' }}
      />

      <div className="group-drag-handle absolute top-3 left-4 flex items-center gap-2">
        {editingLabel ? (
          <input
            autoFocus value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') commitLabel(); e.stopPropagation() }}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold px-2 py-0.5 rounded-md outline-none"
            style={{ color: color.label, background: 'rgba(255,255,255,0.6)', border: `1px solid ${color.border}`, fontFamily: "'DM Sans', sans-serif", minWidth: 80 }}
          />
        ) : (
          <span
            className="text-sm font-semibold px-2 py-0.5 rounded-full cursor-text"
            style={{ color: color.label, background: 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', sans-serif" }}
            onDoubleClick={(e) => { e.stopPropagation(); setEditingLabel(true) }}
          >
            {data.label || 'Group'}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); updateNodeData(id, { colorIdx: ((data.colorIdx ?? 1) + 1) % GROUP_COLORS.length }) }}
          className="w-4 h-4 rounded-full border-2 border-white opacity-60 hover:opacity-100 transition-opacity"
          style={{ background: color.label }}
          title="Change color"
        />
        <button
          onClick={(e) => { e.stopPropagation(); removeNode(id) }}
          className="w-4 h-4 rounded-full flex items-center justify-center text-xs opacity-40 hover:opacity-80 transition-opacity"
          style={{ color: color.label }}
        >✕</button>
      </div>
    </motion.div>
  )
})

export default GroupFrame
