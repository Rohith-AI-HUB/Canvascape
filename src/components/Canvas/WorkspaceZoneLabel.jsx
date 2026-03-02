import { memo } from 'react'

/**
 * WorkspaceZoneLabel — a phantom node rendered at each workspace's origin.
 * Shows the workspace emoji + label and a subtle colored radial gradient.
 * Prominent when zoomed out, fades when zoomed in close.
 * Not draggable, not selectable — purely visual.
 */
const WorkspaceZoneLabel = memo(function WorkspaceZoneLabel({ data }) {
    const { label, emoji, color } = data

    return (
        <div
            style={{
                width: 4000,
                height: 4000,
                position: 'relative',
                pointerEvents: 'none',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {/* Radial gradient background */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: `radial-gradient(circle at center, ${color}12 0%, ${color}06 40%, transparent 70%)`,
                    border: `2px dashed ${color}18`,
                }}
            />

            {/* Label */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                    zIndex: 1,
                }}
            >
                {emoji && (
                    <span style={{ fontSize: 120, lineHeight: 1, filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.1))' }}>
                        {emoji}
                    </span>
                )}
                <span
                    style={{
                        fontSize: 64,
                        fontWeight: 800,
                        fontFamily: "'DM Sans', sans-serif",
                        color: color,
                        opacity: 0.25,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        textShadow: `0 2px 24px ${color}20`,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {label}
                </span>
            </div>
        </div>
    )
})

export default WorkspaceZoneLabel
