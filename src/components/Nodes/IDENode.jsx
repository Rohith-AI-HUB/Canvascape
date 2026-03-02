import { memo, useMemo, useState } from 'react'
import { NodeResizer } from 'reactflow'
import { useWorkspaceStore } from '../../store/workspaceStore'

const IDENode = memo(function IDENode({ id, data }) {
  const { updateNodeData, removeNode, resizeNode, setActiveNode, activeNodeId, theme } = useWorkspaceStore()
  const [renderNonce, setRenderNonce] = useState(0)
  const isActive = activeNodeId === id
  const isDark = theme === 'dark'
  const code = data?.code || ''

  const srcDoc = useMemo(() => code, [code, renderNonce])

  return (
    <div style={{ width: '100%', height: '100%' }} onMouseDown={() => setActiveNode(id)}>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 14,
        overflow: 'hidden',
        background: isDark ? '#141310' : '#FFFFFF',
        boxShadow: isActive ? 'var(--sh-active)' : 'var(--sh-card)',
      }}>
        <NodeResizer
          minWidth={460}
          minHeight={300}
          isVisible={isActive}
          onResizeEnd={(_, p) => resizeNode(id, p.width, p.height)}
          lineStyle={{ borderColor: 'var(--a)' }}
          handleStyle={{
            width: 9,
            height: 9,
            background: 'var(--a)',
            border: '2px solid var(--s1)',
            borderRadius: '50%',
            boxShadow: '0 0 8px var(--a-glow)',
          }}
        />

        <div
          className="node-drag-handle"
          style={{
            height: 38,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 10px',
            background: isDark ? 'rgba(255,245,220,0.03)' : 'rgba(100,80,40,0.04)',
            borderBottom: `1px solid ${isDark ? 'rgba(255,245,220,0.08)' : 'rgba(100,80,40,0.12)'}`,
            cursor: 'grab',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--a)', fontWeight: 700, letterSpacing: '0.04em' }}>LIVE IDE</span>
          <input
            value={data?.title || 'Live IDE Preview'}
            onChange={(e) => updateNodeData(id, { title: e.target.value })}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              minWidth: 0,
              height: 24,
              borderRadius: 7,
              border: `1px solid ${isDark ? 'rgba(255,245,220,0.08)' : 'rgba(100,80,40,0.12)'}`,
              background: isDark ? '#1A1916' : '#F7F3EA',
              color: 'var(--t1)',
              fontSize: 12,
              padding: '0 8px',
              outline: 'none',
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <button
            onClick={(e) => { e.stopPropagation(); setRenderNonce((n) => n + 1) }}
            style={btnStyle()}
          >
            Render
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); removeNode(id) }}
            style={btnStyle(true)}
          >
            Close
          </button>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0 }}>
          <textarea
            value={code}
            onChange={(e) => updateNodeData(id, { code: e.target.value })}
            spellCheck={false}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              resize: 'none',
              margin: 0,
              padding: '12px 14px',
              background: isDark ? '#0F0E0C' : '#F5F1E8',
              color: isDark ? '#F2EFE8' : '#2A241C',
              fontFamily: "'DM Mono', monospace",
              fontSize: 11.5,
              lineHeight: 1.55,
              borderRight: `1px solid ${isDark ? 'rgba(255,245,220,0.08)' : 'rgba(100,80,40,0.12)'}`,
              boxSizing: 'border-box',
            }}
          />
          <iframe
            title={data?.title || 'Live IDE Preview'}
            sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
            srcDoc={srcDoc}
            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
          />
        </div>
      </div>
    </div>
  )
})

function btnStyle(isDanger = false) {
  return {
    height: 24,
    padding: '0 9px',
    borderRadius: 7,
    border: `1px solid ${isDanger ? 'rgba(248,113,113,0.4)' : 'var(--bd-a)'}`,
    background: isDanger ? 'rgba(248,113,113,0.12)' : 'var(--a-bg)',
    color: isDanger ? '#FCA5A5' : 'var(--a)',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer',
    flexShrink: 0,
  }
}

export default IDENode
