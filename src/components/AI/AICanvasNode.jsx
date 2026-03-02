import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { NodeResizer } from 'reactflow'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { streamAI } from './useAIStream'
import { AIIcon } from './AIPanel'
import MarkdownMessage from './MarkdownMessage'

// ─────────────────────────────────────────────────────────────────────────────
// Scroll isolation hook
// Attaches a NATIVE wheel event listener (not React synthetic) that calls
// stopPropagation() on the raw DOM event. This is the only reliable way to
// prevent ReactFlow's own native listeners (preventScrolling + panOnScroll)
// from consuming wheel events meant for scrollable child elements.
// React's onWheelCapture/onWheel only touches synthetic events and has
// zero effect on ReactFlow's native DOM addEventListener listeners.
// ─────────────────────────────────────────────────────────────────────────────
function useScrollIsolation() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const stop = (e) => {
      // stopPropagation on the NATIVE event — prevents bubble reaching
      // ReactFlow's native wheel listener which calls e.preventDefault()
      // (which is what kills scroll inside nodes).
      e.stopPropagation()
      // Do NOT call preventDefault — the browser must handle the scroll itself.
    }
    // Attach in bubble phase so we fire at this element before it reaches
    // ReactFlow's listener on the ancestor container.
    el.addEventListener('wheel', stop, { passive: true })
    el.addEventListener('touchmove', stop, { passive: true })
    return () => {
      el.removeEventListener('wheel', stop, { passive: true })
      el.removeEventListener('touchmove', stop, { passive: true })
    }
  }, [])
  return ref
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const PROVIDERS = [
  {
    id: 'openai', name: 'OpenAI', color: '#10A37F', bg: 'rgba(16,163,127,0.1)',
    Logo: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.28 9.78a5.74 5.74 0 0 0-.49-4.73 5.85 5.85 0 0 0-6.3-2.8 5.74 5.74 0 0 0-4.32-1.93 5.85 5.85 0 0 0-5.58 4.05 5.74 5.74 0 0 0-3.83 2.78 5.85 5.85 0 0 0 .72 6.87 5.74 5.74 0 0 0 .49 4.73 5.85 5.85 0 0 0 6.3 2.8 5.74 5.74 0 0 0 4.32 1.93 5.85 5.85 0 0 0 5.58-4.05 5.74 5.74 0 0 0 3.83-2.78 5.85 5.85 0 0 0-.72-6.87zM13.18 20.9a4.33 4.33 0 0 1-2.78-.99l.14-.08 4.61-2.66a.76.76 0 0 0 .38-.66v-6.51l1.95 1.13a.07.07 0 0 1 .04.05v5.38a4.35 4.35 0 0 1-4.34 4.34zM3.73 17.1a4.33 4.33 0 0 1-.52-2.91l.14.08 4.61 2.66a.76.76 0 0 0 .76 0l5.63-3.25v2.26a.07.07 0 0 1-.03.06L9.65 18.6a4.35 4.35 0 0 1-5.92-1.5zM2.9 8.26A4.33 4.33 0 0 1 5.16 6.1v5.46a.76.76 0 0 0 .38.66l5.63 3.25-1.95 1.13a.07.07 0 0 1-.07 0L4.52 13.8A4.35 4.35 0 0 1 2.9 8.26zm16.03 3.74-5.63-3.25 1.95-1.13a.07.07 0 0 1 .07 0l4.63 2.67a4.35 4.35 0 0 1-.67 7.85v-5.46a.76.76 0 0 0-.35-.68zm1.94-2.93-.14-.08-4.61-2.66a.76.76 0 0 0-.76 0L9.73 9.58V7.32a.07.07 0 0 1 .03-.06l4.63-2.67a4.35 4.35 0 0 1 6.48 4.48zM8.72 12.82l-1.95-1.13a.07.07 0 0 1-.04-.05V6.26a4.35 4.35 0 0 1 7.13-3.34l-.14.08-4.61 2.66a.76.76 0 0 0-.38.66l-.01 6.5zm1.06-2.28 2.5-1.44 2.5 1.44v2.88l-2.5 1.44-2.5-1.44V10.54z"/>
      </svg>
    ),
  },
  {
    id: 'anthropic', name: 'Anthropic', color: '#D97706', bg: 'rgba(217,119,6,0.1)',
    Logo: () => (
      <svg width="16" height="16" viewBox="0 0 92 65" fill="currentColor">
        <path d="M66.5 0H52.4L92 65h14.1L66.5 0ZM25.5 0 0 65h14.4l5.2-13.4h26.5L51.3 65h14.4L40.2 0H25.5Zm-1.8 39.9 9.3-23.7 9.3 23.7H23.7Z" transform="scale(0.85) translate(5, 3)"/>
      </svg>
    ),
  },
  {
    id: 'gemini', name: 'Google', color: '#4285F4', bg: 'rgba(66,133,244,0.1)',
    Logo: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: 'ollama', name: 'Ollama', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)',
    Logo: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6"/>
        <circle cx="8" cy="15" r="3" stroke="currentColor" strokeWidth="1.6"/>
        <circle cx="16" cy="15" r="3" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M11 12l-2 2M13 12l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M8 18v2M16 18v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
]

const MODEL_OPTIONS = {
  openai:    ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o3-mini'],
  anthropic: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
  gemini:    ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  ollama:    null,
}

const SUGGESTIONS = [
  { icon: '🗂', text: 'Summarize all my open tabs' },
  { icon: '🎯', text: 'What should I focus on right now?' },
  { icon: '✍️', text: 'Help me write a brief on this research' },
  { icon: '🔗', text: 'Find connections between my tabs' },
]

const COMMANDS = [
  { cmd: '/clear',   desc: 'Clear current conversation' },
  { cmd: '/new',     desc: 'Start a new conversation' },
  { cmd: '/copy',    desc: 'Copy full conversation to clipboard' },
  { cmd: '/help',    desc: 'Show available commands' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Conversation helpers
// ─────────────────────────────────────────────────────────────────────────────
function newConv() {
  return { id: `cv_${Date.now()}_${Math.random().toString(36).slice(2,5)}`, title: 'New chat', messages: [], createdAt: Date.now(), updatedAt: Date.now() }
}

function initConvs(data) {
  if (data.conversations?.length) return { conversations: data.conversations, activeConvId: data.activeConvId || data.conversations[0].id }
  const cv = newConv()
  if (data.messages?.length) { cv.messages = data.messages; cv.title = data.messages.find(m => m.role === 'user')?.content?.slice(0, 52) || 'Chat' }
  return { conversations: [cv], activeConvId: cv.id }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main node
// ─────────────────────────────────────────────────────────────────────────────
export default function AICanvasNode({ id, data, selected }) {
  const { updateNodeData, removeNode, nodes, aiProvider, setAIProvider, aiContextEnabled, setAIContextEnabled, setActiveNode, theme, activeWorkspaceId, getActiveWorkspace } = useWorkspaceStore()

  const activeWorkspace = getActiveWorkspace()
  const workspaceId = data.workspaceId || activeWorkspaceId

  const init = useMemo(() => initConvs(data), []) // eslint-disable-line react-hooks/exhaustive-deps

  const [conversations, setConversations] = useState(init.conversations)
  const [activeConvId,  setActiveConvId]  = useState(init.activeConvId)
  const [tab,       setTab]       = useState('chat')
  const [input,     setInput]     = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error,     setError]     = useState(null)
  const [cmdMenu,   setCmdMenu]   = useState(false)
  // Track our own active state so resize handles are shown reliably
  // without depending solely on ReactFlow's `selected` prop timing.
  const [isActive, setIsActive]   = useState(false)

  const abortRef  = useRef(null)
  const bottomRef = useRef(null)
  const taRef     = useRef(null)
  const isDark    = theme === 'dark'

  const activeConv   = conversations.find(c => c.id === activeConvId) || conversations[0]
  const messages     = activeConv?.messages || []
  const activeProv   = PROVIDERS.find(p => p.id === aiProvider.active) || PROVIDERS[0]
  const d            = isDark
  const surface      = d ? 'rgba(18,17,14,0.98)' : 'rgba(253,252,248,0.98)'
  const border       = d ? 'rgba(255,245,220,0.09)' : 'rgba(100,80,40,0.13)'

  // Show resize handles when either ReactFlow says selected OR our own isActive is true
  const showResizer = selected || isActive

  // Bring node to front and mark active on any mousedown on the card
  const handleCardMouseDown = useCallback((e) => {
    setIsActive(true)
    setActiveNode(id)
    // Do NOT stop propagation here — ReactFlow needs to see this to properly
    // select the node (selected prop) and manage z-order internally.
  }, [id, setActiveNode])

  // Deactivate when clicking elsewhere (listen on window)
  useEffect(() => {
    const onDown = (e) => {
      // If click landed outside this node's card, clear active
      if (!e.target.closest(`[data-nodeid="${id}"]`)) {
        setIsActive(false)
      }
    }
    window.addEventListener('mousedown', onDown, { capture: true })
    return () => window.removeEventListener('mousedown', onDown, { capture: true })
  }, [id])

  useEffect(() => {
    updateNodeData(id, { conversations, activeConvId, messages: undefined })
  }, [conversations, activeConvId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab === 'chat') bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, tab])

  useEffect(() => {
    if (!taRef.current) return
    taRef.current.style.height = 'auto'
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 100) + 'px'
  }, [input])

  const filteredCmds = useMemo(() => {
    if (!input.startsWith('/')) return []
    return COMMANDS.filter(c => c.cmd.startsWith(input.toLowerCase().split(' ')[0]))
  }, [input])

  useEffect(() => { setCmdMenu(filteredCmds.length > 0) }, [filteredCmds.length])

  // ── Conversation management ──────────────────────────────────────────────────
  const updateConv = useCallback((convId, patch) => {
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, ...patch, updatedAt: Date.now() } : c))
  }, [])

  const newChat = useCallback(() => {
    const cv = newConv()
    setConversations(prev => [cv, ...prev])
    setActiveConvId(cv.id)
    setTab('chat')
  }, [])

  const openConv = useCallback((convId) => {
    setActiveConvId(convId)
    setTab('chat')
  }, [])

  const deleteConv = useCallback((convId) => {
    setConversations(prev => {
      const next = prev.filter(c => c.id !== convId)
      if (next.length === 0) {
        const fresh = newConv()
        setActiveConvId(fresh.id)
        return [fresh]
      }
      if (convId === activeConvId) setActiveConvId(next[0].id)
      return next
    })
  }, [activeConvId])

  const deleteMessage = useCallback((msgId) => {
    if (!activeConv) return
    updateConv(activeConv.id, { messages: activeConv.messages.filter(m => m.id !== msgId) })
  }, [activeConv, updateConv])

  // ── Workspace context ────────────────────────────────────────────────────────
  const buildContext = useCallback(() => {
    const wsNodes = nodes.filter(n => n.data?.workspaceId === workspaceId || (!workspaceId && !n.data?.workspaceId))
    const tabs = wsNodes.filter(n => n.type === 'webNode')
    const ides = wsNodes.filter(n => n.type === 'ideNode').length
    const list = tabs.length
      ? tabs.map((n, i) => `${i + 1}. "${n.data.title || 'Untitled'}" — ${n.data.url}${n.data.note ? ` [note: ${n.data.note}]` : ''}`).join('\n')
      : 'No web tabs open in this workspace.'
    return `You are an AI assistant embedded as a card in Canvascape, a spatial canvas browser.\n\nThis chat is scoped to the "${activeWorkspace?.label || 'Default'}" workspace.\n\nOpen tabs in this workspace (${tabs.length}):\n${list}\nLive IDE cards: ${ides}\n\nBe concise. When creating a webpage, output complete HTML inside one \`\`\`html block.`
  }, [nodes, workspaceId, activeWorkspace])

  // ── Slash commands ────────────────────────────────────────────────────────────
  const execCommand = useCallback((cmd) => {
    setInput('')
    setCmdMenu(false)
    switch (cmd) {
      case '/clear':
        updateConv(activeConv.id, { messages: [], title: 'New chat' })
        break
      case '/new':
        newChat()
        break
      case '/copy': {
        const text = messages.map(m => `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`).join('\n\n')
        navigator.clipboard.writeText(text).catch(() => {})
        break
      }
      case '/help': {
        const helpMsg = {
          id: `m_${Date.now()}`, role: 'assistant', ts: Date.now(),
          content: COMMANDS.map(c => `**${c.cmd}** — ${c.desc}`).join('\n'),
        }
        updateConv(activeConv.id, { messages: [...messages, helpMsg] })
        break
      }
      default: break
    }
  }, [activeConv, messages, updateConv, newChat])

  // ── Send ─────────────────────────────────────────────────────────────────────
  const send = useCallback(async (overrideText) => {
    const text = (overrideText ?? input).trim()
    if (!text || streaming) return

    if (text.startsWith('/')) {
      const cmd = text.split(' ')[0]
      if (COMMANDS.find(c => c.cmd === cmd)) { execCommand(cmd); return }
    }

    setInput('')
    setError(null)
    setCmdMenu(false)

    const userMsg = { id: `m_${Date.now()}`,     role: 'user',      content: text, ts: Date.now() }
    const asstMsg = { id: `m_${Date.now() + 1}`, role: 'assistant', content: '',   ts: Date.now() }
    const newMsgs = [...messages, userMsg, asstMsg]

    const title = (activeConv?.title === 'New chat' && !messages.length)
      ? text.slice(0, 52) + (text.length > 52 ? '…' : '')
      : activeConv?.title

    updateConv(activeConv.id, { messages: newMsgs, title })
    setStreaming(true)

    const apiMsgs = []
    if (aiContextEnabled) apiMsgs.push({ role: 'system', content: buildContext() })
    messages.slice(-16).forEach(m => {
      if (m.role === 'user' || m.role === 'assistant') apiMsgs.push({ role: m.role, content: m.content })
    })
    apiMsgs.push({ role: 'user', content: text })

    abortRef.current = new AbortController()
    let acc = ''

    await streamAI({
      provider: { name: aiProvider.active, ...aiProvider[aiProvider.active] },
      messages: apiMsgs,
      signal:   abortRef.current.signal,
      onChunk: (c) => {
        acc += c
        setConversations(prev => prev.map(cv => {
          if (cv.id !== activeConvId) return cv
          const msgs = [...cv.messages]
          msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: acc }
          return { ...cv, messages: msgs, updatedAt: Date.now() }
        }))
      },
      onDone:  () => { setStreaming(false); abortRef.current = null },
      onError: (msg) => {
        setError(msg)
        setConversations(prev => prev.map(cv => {
          if (cv.id !== activeConvId) return cv
          const msgs = [...cv.messages]
          msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: `⚠️ ${msg}` }
          return { ...cv, messages: msgs, updatedAt: Date.now() }
        }))
        setStreaming(false)
        abortRef.current = null
      },
    })
  }, [input, streaming, messages, activeConv, activeConvId, aiProvider, aiContextEnabled, buildContext, updateConv, execCommand])

  const stop = () => { abortRef.current?.abort(); setStreaming(false) }

  const onKey = (e) => {
    e.stopPropagation()
    if (cmdMenu && e.key === 'Escape') { setCmdMenu(false); return }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <NodeResizer
        isVisible={showResizer}
        minWidth={320} minHeight={380}
        lineStyle={{ borderColor: 'var(--a)', borderWidth: 1.5 }}
        handleStyle={{
          width: 12, height: 12, borderRadius: 4,
          background: 'var(--a)', border: '2px solid var(--s1)',
          boxShadow: '0 0 6px var(--a-glow)',
          // Always above the card content
          zIndex: 100,
        }}
      />

      {/* data-nodeid lets the outside-click detector identify this node's DOM */}
      <div
        data-nodeid={id}
        onMouseDown={handleCardMouseDown}
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          background: surface,
          border: `1.5px solid ${showResizer ? 'var(--bd-a)' : border}`,
          borderRadius: 16,
          boxShadow: showResizer
            ? `0 0 0 3px var(--a-glow), 0 12px 40px rgba(0,0,0,${d ? 0.6 : 0.14})`
            : `0 4px 28px rgba(0,0,0,${d ? 0.45 : 0.1})`,
          fontFamily: "'DM Sans', sans-serif",
          overflow: 'hidden',
          transition: 'box-shadow 200ms, border-color 200ms',
        }}>

        {/* ── Header (drag handle) ───────────────────────────────────────── */}
        <div
          className="node-drag-handle"
          onMouseDown={e => {
            // Header IS the drag handle — let the event reach ReactFlow for drag.
            // But stop it from triggering canvas pan.
            e.stopPropagation()
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px 0 12px', height: 46, flexShrink: 0, borderBottom: `1px solid ${border}`, cursor: 'grab', userSelect: 'none', background: d ? 'rgba(255,255,255,0.013)' : 'rgba(0,0,0,0.018)' }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 9, background: 'var(--a-bg)', border: '1px solid var(--bd-a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AIIcon size={13} color="var(--a)"/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.025em', lineHeight: 1.2 }}>AI Chat</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: activeProv.color, flexShrink: 0 }}/>
              <span style={{ fontSize: 9.5, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeProv.name} · {aiProvider[aiProvider.active]?.model || '—'}</span>
            </div>
          </div>

          <HdrBtn onMouseDown={e => e.stopPropagation()} onClick={() => setAIContextEnabled(!aiContextEnabled)} title={aiContextEnabled ? 'Canvas context on' : 'Canvas context off'} active={aiContextEnabled} d={d}>
            <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
            <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" opacity="0.5"/>
            <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" opacity="0.5"/>
            <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" opacity="0.25"/>
          </HdrBtn>

          <HdrBtn onMouseDown={e => e.stopPropagation()} onClick={newChat} title="New conversation" d={d}>
            <path d="M7 1.5v5M7 8.5v5M1.5 7h5M8.5 7h5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
          </HdrBtn>

          <button onMouseDown={e => e.stopPropagation()} onClick={() => removeNode(id)} title="Close"
            style={{ width: 24, height: 24, borderRadius: 7, border: 'none', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms', flexShrink: 0, padding: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,65,65,0.1)'; e.currentTarget.style.color = '#F87171' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t3)' }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* ── Content ───────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {tab === 'chat'     && <ChatPane messages={messages} streaming={streaming} onSuggest={t => send(t)} isDark={d} border={border} bottomRef={bottomRef} onDeleteMsg={deleteMessage}/>}
          {tab === 'history'  && <HistoryPane conversations={conversations} activeConvId={activeConvId} onOpen={openConv} onDelete={deleteConv} isDark={d} border={border}/>}
          {tab === 'settings' && <SettingsPane provider={aiProvider} setProvider={setAIProvider} isDark={d} border={border}/>}
        </div>

        {/* ── Error ─────────────────────────────────────────────────────────── */}
        {error && tab === 'chat' && (
          <div onMouseDown={e => e.stopPropagation()} style={{ margin: '0 10px', padding: '6px 10px', borderRadius: 8, flexShrink: 0, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11, color: '#F87171', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <span>⚠</span>
            <span style={{ flex: 1, lineHeight: 1.5 }}>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F87171', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* ── Input ─────────────────────────────────────────────────────────── */}
        {tab === 'chat' && (
          <div
            style={{ flexShrink: 0, padding: '8px 10px 8px', borderTop: `1px solid ${border}`, position: 'relative' }}
            onMouseDown={e => e.stopPropagation()}
          >
            {cmdMenu && filteredCmds.length > 0 && (
              <div style={{ position: 'absolute', bottom: '100%', left: 10, right: 10, background: surface, border: `1px solid ${border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 4, boxShadow: `0 -4px 20px rgba(0,0,0,${d ? 0.5 : 0.12})`, zIndex: 10 }}>
                {filteredCmds.map(c => (
                  <button key={c.cmd} onMouseDown={e => { e.preventDefault(); execCommand(c.cmd) }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 120ms' }}
                    onMouseEnter={e => e.currentTarget.style.background = d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <code style={{ fontSize: 11.5, color: 'var(--a)', fontFamily: "'DM Mono', monospace", minWidth: 60 }}>{c.cmd}</code>
                    <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>{c.desc}</span>
                  </button>
                ))}
                <div style={{ padding: '5px 12px 6px', borderTop: `1px solid ${border}`, fontSize: 9.5, color: 'var(--t4)' }}>click or ↵ to run</div>
              </div>
            )}

            <div style={{ borderRadius: 12, border: `1.5px solid ${border}`, background: d ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', transition: 'border-color 160ms' }}>
              <textarea ref={taRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
                placeholder="Message AI… or type / for commands"
                rows={1}
                style={{ width: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent', padding: '9px 12px 0', color: 'var(--t1)', fontSize: 13, lineHeight: 1.5, fontFamily: 'inherit', boxSizing: 'border-box', minHeight: 20, maxHeight: 100, overflowY: 'auto', userSelect: 'text' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 7px' }}>
                <span style={{ fontSize: 9.5, color: 'var(--t4)' }}>↵ send · ⇧↵ newline · / commands</span>
                {streaming ? (
                  <button onClick={stop} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#F87171', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                    <span style={{ width: 5, height: 5, borderRadius: 1.5, background: '#F87171' }}/>Stop
                  </button>
                ) : (
                  <button onClick={() => send()} disabled={!input.trim()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 7, border: `1px solid ${input.trim() ? 'var(--bd-a)' : border}`, background: input.trim() ? 'var(--a-bg)' : 'transparent', color: input.trim() ? 'var(--a)' : 'var(--t4)', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: input.trim() ? 'pointer' : 'default', transition: 'all 130ms' }}>
                    Send <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Bottom nav ────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', borderTop: `1px solid ${border}`, flexShrink: 0 }}>
          {[
            { id: 'chat',     label: 'Chat',    icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 2h10v6.5H7.5l-2 2.5V8.5H2V2z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/></svg> },
            { id: 'history',  label: 'History', icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.25"/><path d="M7 4.5V7l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
            { id: 'settings', label: 'Model',   icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.25"/><path d="M7 1.5v1M7 11.5v1M1.5 7h1M11.5 7h1M3.1 3.1l.7.7M10.2 10.2l.7.7M10.2 3.1l-.7.7M4.5 10.2l-.7.7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg> },
          ].map(item => {
            const active = tab === item.id
            const badge  = item.id === 'history' && conversations.length > 1 ? conversations.length : null
            return (
              <button key={item.id} onMouseDown={e => e.stopPropagation()} onClick={() => setTab(item.id)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, height: 44, border: 'none', background: 'transparent', color: active ? 'var(--a)' : 'var(--t3)', cursor: 'pointer', fontFamily: 'inherit', transition: 'color 140ms', position: 'relative' }}>
                {active && <div style={{ position: 'absolute', top: 0, left: 14, right: 14, height: 2, borderRadius: '0 0 2px 2px', background: 'var(--a)' }}/>}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.icon}
                  {badge && <span style={{ position: 'absolute', top: -4, right: -7, minWidth: 13, height: 13, borderRadius: 999, background: 'var(--a)', color: '#fff', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>{badge}</span>}
                </div>
                <span style={{ fontSize: 9.5, fontWeight: active ? 600 : 400, letterSpacing: '0.03em' }}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat pane
// ─────────────────────────────────────────────────────────────────────────────
function ChatPane({ messages, streaming, onSuggest, isDark, border, bottomRef, onDeleteMsg }) {
  // NATIVE scroll isolation — the only reliable way to prevent ReactFlow's
  // native wheel listeners (preventScrolling + panOnScroll) from consuming
  // events meant for this scrollable area.
  const scrollRef = useScrollIsolation()

  return (
    <div
      ref={scrollRef}
      style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: 8, scrollbarWidth: 'thin' }}
    >
      {messages.length === 0
        ? <EmptyState isDark={isDark} onSuggest={onSuggest}/>
        : messages.map((msg, i) => (
            <NodeMsgBubble
              key={msg.id} msg={msg} isDark={isDark}
              isStreaming={streaming && i === messages.length - 1 && msg.role === 'assistant'}
              onDelete={() => onDeleteMsg(msg.id)}
            />
          ))
      }
      <div ref={bottomRef}/>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// History pane
// ─────────────────────────────────────────────────────────────────────────────
function HistoryPane({ conversations, activeConvId, onOpen, onDelete, isDark, border }) {
  const scrollRef = useScrollIsolation()
  const d  = isDark
  const s2 = d ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'

  return (
    <div
      ref={scrollRef}
      style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 5, scrollbarWidth: 'thin' }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 4, paddingLeft: 2 }}>
        {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
      </div>

      {conversations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--t3)', fontSize: 12 }}>No conversations yet</div>
      )}

      {conversations.map(conv => {
        const isActive  = conv.id === activeConvId
        const preview   = conv.messages.find(m => m.role === 'assistant')?.content?.slice(0, 65) || 'No reply yet'
        const msgCount  = conv.messages.length
        return (
          <div
            key={conv.id}
            onClick={() => onOpen(conv.id)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 10px',
              borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${isActive ? 'var(--bd-a)' : border}`,
              background: isActive ? 'var(--a-bg)' : s2,
              transition: 'all 130ms', position: 'relative',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = d ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.035)' }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = s2 }}
          >
            <div style={{ width: 26, height: 26, borderRadius: 7, background: isActive ? 'var(--a-bg)' : border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1.5 1.5h9v5.5H6.5l-1.5 2V7H1.5V1.5z" stroke={isActive ? 'var(--a)' : 'var(--t3)'} strokeWidth="1.15" strokeLinejoin="round"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: isActive ? 'var(--a)' : 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{conv.title}</div>
              <div style={{ fontSize: 10.5, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>{preview}</div>
              <div style={{ fontSize: 9.5, color: 'var(--t4)', marginTop: 3 }}>{relTime(conv.updatedAt)} · {msgCount} msg{msgCount !== 1 ? 's' : ''}</div>
            </div>

            <button
              onClick={e => { e.stopPropagation(); onDelete(conv.id) }}
              title="Delete conversation"
              style={{ position: 'absolute', top: 7, right: 8, width: 20, height: 20, borderRadius: 5, border: 'none', background: 'transparent', color: 'var(--t4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'all 120ms', padding: 0 }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(248,65,65,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '0' }}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1.5 3h9M4.5 3V2h3v1M3 3l.5 7h5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings pane
// ─────────────────────────────────────────────────────────────────────────────
function SettingsPane({ provider, setProvider, isDark, border }) {
  const scrollRef = useScrollIsolation()

  const [active,       setActive]       = useState(provider.active)
  const [ollamaModels, setOllamaModels] = useState([])
  const [detecting,    setDetecting]    = useState(false)
  const [detectMsg,    setDetectMsg]    = useState('')

  const prov   = PROVIDERS.find(p => p.id === active) || PROVIDERS[0]
  const cfg    = provider[active] || {}
  const models = MODEL_OPTIONS[active]

  const update = (key, val) => setProvider({ [active]: { ...provider[active], [key]: val } })
  const switchProvider = (id) => { setActive(id); setProvider({ active: id }) }

  const detectOllama = useCallback(async () => {
    setDetecting(true); setDetectMsg(''); setOllamaModels([])
    const base = normalizeOllama(cfg.baseUrl || 'http://localhost:11434')
    try {
      let names = []
      const res = await fetch(`${base}/api/tags`)
      if (res.ok) {
        const body = await res.json().catch(() => ({}))
        names = (body.models || []).map(m => m?.name).filter(Boolean)
      } else if (res.status === 404) {
        const v1 = await fetch(`${base}/v1/models`)
        if (!v1.ok) throw new Error(`Ollama ${v1.status}`)
        const body = await v1.json().catch(() => ({}))
        names = (body.data || []).map(m => m?.id).filter(Boolean)
      } else {
        throw new Error(`Ollama ${res.status}: ${res.statusText}`)
      }
      const unique = [...new Set(names)]
      setOllamaModels(unique)
      if (unique.length === 0) setDetectMsg('No models found. Try: ollama pull llama3.2')
      else { setDetectMsg(`${unique.length} model${unique.length > 1 ? 's' : ''} found`); if (!cfg.model) update('model', unique[0]) }
    } catch (e) {
      setDetectMsg(e?.message || 'Cannot reach Ollama. Is it running?')
    } finally {
      setDetecting(false)
    }
  }, [cfg.baseUrl, cfg.model]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (active === 'ollama') { const t = setTimeout(detectOllama, 400); return () => clearTimeout(t) }
  }, [active, cfg.baseUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  const s2 = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'

  return (
    <div
      ref={scrollRef}
      style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 15, scrollbarWidth: 'thin' }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div>
        <SLabel>Provider</SLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
          {PROVIDERS.map(p => {
            const isA = active === p.id
            return (
              <button key={p.id} onMouseDown={e => e.stopPropagation()} onClick={() => switchProvider(p.id)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 4px', borderRadius: 10, border: `1.5px solid ${isA ? p.color + '70' : border}`, background: isA ? p.bg : s2, color: isA ? p.color : 'var(--t3)', cursor: 'pointer', transition: 'all 140ms', fontFamily: 'inherit' }}
                onMouseEnter={e => { if (!isA) { e.currentTarget.style.borderColor = `${p.color}40`; e.currentTarget.style.background = p.bg } }}
                onMouseLeave={e => { if (!isA) { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = s2 } }}>
                <div style={{ color: isA ? p.color : 'var(--t3)' }}><p.Logo/></div>
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.02em', lineHeight: 1, textAlign: 'center' }}>{p.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ height: 1, background: border }}/>

      {active !== 'ollama' && (
        <div>
          <SLabel>API Key</SLabel>
          <input type="password" value={cfg.apiKey || ''} onChange={e => update('apiKey', e.target.value)} onMouseDown={e => e.stopPropagation()} placeholder={`${prov.name} API key…`}
            style={{ width: '100%', padding: '8px 11px', borderRadius: 9, border: `1px solid ${border}`, outline: 'none', background: s2, color: 'var(--t1)', fontSize: 12, fontFamily: "'DM Mono', monospace", boxSizing: 'border-box', transition: 'border-color 140ms' }}
            onFocus={e => e.target.style.borderColor = 'var(--bd-a)'} onBlur={e => e.target.style.borderColor = border}/>
        </div>
      )}

      {active === 'ollama' && (
        <div>
          <SLabel>Endpoint URL</SLabel>
          <input type="text" value={cfg.baseUrl || ''} onChange={e => update('baseUrl', e.target.value)} onMouseDown={e => e.stopPropagation()} placeholder="http://localhost:11434"
            style={{ width: '100%', padding: '8px 11px', borderRadius: 9, border: `1px solid ${border}`, outline: 'none', background: s2, color: 'var(--t1)', fontSize: 12, fontFamily: "'DM Mono', monospace", boxSizing: 'border-box', transition: 'border-color 140ms' }}
            onFocus={e => e.target.style.borderColor = 'var(--bd-a)'} onBlur={e => e.target.style.borderColor = border}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <button onMouseDown={e => e.stopPropagation()} onClick={detectOllama} disabled={detecting}
              style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${border}`, background: s2, color: 'var(--t2)', fontSize: 11, fontFamily: 'inherit', cursor: detecting ? 'default' : 'pointer', opacity: detecting ? 0.7 : 1 }}>
              {detecting ? 'Detecting…' : 'Detect Models'}
            </button>
            {detectMsg && <span style={{ fontSize: 10.5, color: detectMsg.includes('found') ? 'var(--t3)' : '#F87171', lineHeight: 1.4 }}>{detectMsg}</span>}
          </div>
        </div>
      )}

      <div>
        <SLabel>Model</SLabel>
        {models ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {models.map(m => {
              const isSel = cfg.model === m
              return (
                <button key={m} onMouseDown={e => e.stopPropagation()} onClick={() => update('model', m)}
                  style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontFamily: "'DM Mono', monospace", border: `1px solid ${isSel ? 'var(--bd-a)' : border}`, background: isSel ? 'var(--a-bg)' : s2, color: isSel ? 'var(--a)' : 'var(--t2)', cursor: 'pointer', transition: 'all 120ms' }}>
                  {m}
                </button>
              )
            })}
          </div>
        ) : (
          <>
            <input type="text" value={cfg.model || ''} onChange={e => update('model', e.target.value)} onMouseDown={e => e.stopPropagation()} placeholder="e.g. llama3.2, mistral, gemma2"
              style={{ width: '100%', padding: '8px 11px', borderRadius: 9, border: `1px solid ${border}`, outline: 'none', background: s2, color: 'var(--t1)', fontSize: 12, fontFamily: "'DM Mono', monospace", boxSizing: 'border-box', transition: 'border-color 140ms', marginBottom: 8 }}
              onFocus={e => e.target.style.borderColor = 'var(--bd-a)'} onBlur={e => e.target.style.borderColor = border}/>
            {ollamaModels.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {ollamaModels.map(m => {
                  const isSel = cfg.model === m
                  return (
                    <button key={m} onMouseDown={e => e.stopPropagation()} onClick={() => update('model', m)}
                      style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontFamily: "'DM Mono', monospace", border: `1px solid ${isSel ? 'var(--bd-a)' : border}`, background: isSel ? 'var(--a-bg)' : s2, color: isSel ? 'var(--a)' : 'var(--t2)', cursor: 'pointer', transition: 'all 120ms' }}>
                      {m}
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ padding: '9px 11px', borderRadius: 10, background: 'var(--a-bg)', border: '1px solid var(--bd-a)', fontSize: 11, color: 'var(--t2)', lineHeight: 1.6, display: 'flex', gap: 7, alignItems: 'flex-start' }}>
        <span style={{ flexShrink: 0 }}>🔒</span>
        <span>Keys are stored only in your local workspace file.</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ isDark, onSuggest }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 8px', gap: 16, minHeight: 180 }}>
      <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--a-bg)', border: '1.5px solid var(--bd-a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AIIcon size={20} color="var(--a)" glow/>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em', marginBottom: 4 }}>Ask anything</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.55 }}>Canvas-aware AI · type / for commands</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: '100%' }}>
        {SUGGESTIONS.map(s => (
          <button key={s.text} onMouseDown={e => e.stopPropagation()} onClick={() => onSuggest(s.text)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, border: `1px solid ${isDark ? 'rgba(255,245,220,0.07)' : 'rgba(100,80,40,0.1)'}`, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', color: 'var(--t2)', fontSize: 11.5, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', transition: 'all 120ms' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bd-a)'; e.currentTarget.style.background = 'var(--a-bg)'; e.currentTarget.style.color = 'var(--a)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(255,245,220,0.07)' : 'rgba(100,80,40,0.1)'; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'; e.currentTarget.style.color = 'var(--t2)' }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{s.icon}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Message bubble
// ─────────────────────────────────────────────────────────────────────────────
function NodeMsgBubble({ msg, isDark, isStreaming, onDelete }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'

  const copy = () => {
    navigator.clipboard.writeText(msg.content).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 3 }}>
      <span style={{ fontSize: 9.5, color: 'var(--t3)', fontWeight: 600, letterSpacing: '0.04em', paddingLeft: isUser ? 0 : 2, paddingRight: isUser ? 2 : 0 }}>
        {isUser ? 'You' : 'AI'}
      </span>

      <div
        style={{
          maxWidth: '93%', padding: '8px 11px',
          borderRadius: isUser ? '12px 3px 12px 12px' : '3px 12px 12px 12px',
          background: isUser
            ? (isDark ? 'rgba(245,158,11,0.09)' : 'rgba(217,119,6,0.07)')
            : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'),
          border: isUser ? '1px solid var(--bd-a)' : `1px solid ${isDark ? 'rgba(255,245,220,0.07)' : 'rgba(100,80,40,0.1)'}`,
          userSelect: 'text',
          cursor: 'text',
        }}
      >
        {msg.content
          ? <MarkdownMessage content={msg.content} compact/>
          : isStreaming ? <ThinkDots/> : null
        }
        {isStreaming && msg.content && (
          <span style={{ display: 'inline-block', width: 2, height: 11, background: 'var(--a)', borderRadius: 1, marginLeft: 2, verticalAlign: 'middle', animation: 'cur-blink 1s step-end infinite' }}/>
        )}
        <style>{'@keyframes cur-blink{0%,100%{opacity:1}50%{opacity:0}}'}</style>
      </div>

      {msg.content && !isStreaming && (
        <div style={{ display: 'flex', gap: 4, paddingLeft: isUser ? 0 : 2, paddingRight: isUser ? 2 : 0 }}>
          <MsgActionBtn onClick={copy} title={copied ? 'Copied!' : 'Copy message'} active={copied} onMouseDown={e => e.stopPropagation()}>
            {copied
              ? <path d="M2 7l3 3 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              : <><rect x="4" y="2" width="7" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.2"/><rect x="2" y="4" width="7" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.2"/></>
            }
          </MsgActionBtn>
          <MsgActionBtn onClick={onDelete} title="Delete message" danger onMouseDown={e => e.stopPropagation()}>
            <path d="M2 3.5h8M4 3.5V2.5h4v1M3 3.5l.4 6h5.2l.4-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </MsgActionBtn>
        </div>
      )}
    </div>
  )
}

function ThinkDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--a)', opacity: 0.4, animation: `ai-bounce 1.1s ease-in-out ${i * 0.18}s infinite` }}/>
      ))}
      <style>{'@keyframes ai-bounce{0%,80%,100%{transform:scale(0.6);opacity:.3}40%{transform:scale(1);opacity:.9}}'}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function SLabel({ children }) {
  return <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 7 }}>{children}</div>
}

function HdrBtn({ onClick, onMouseDown, title, active, d, children }) {
  return (
    <button onMouseDown={onMouseDown} onClick={onClick} title={title}
      style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: active ? 'var(--a-bg)' : 'transparent', color: active ? 'var(--a)' : 'var(--t3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms', flexShrink: 0, padding: 0 }}
      onMouseEnter={e => { e.currentTarget.style.background = d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = 'var(--t1)' }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? 'var(--a-bg)' : 'transparent'; e.currentTarget.style.color = active ? 'var(--a)' : 'var(--t3)' }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">{children}</svg>
    </button>
  )
}

function MsgActionBtn({ onClick, onMouseDown, title, active, danger, children }) {
  return (
    <button onMouseDown={onMouseDown} onClick={onClick} title={title}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 6, border: 'none', background: active ? 'var(--a-bg)' : 'transparent', color: active ? 'var(--a)' : 'var(--t4)', cursor: 'pointer', transition: 'all 120ms', padding: 0 }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(248,65,65,0.1)' : 'var(--s3)'; e.currentTarget.style.color = danger ? '#F87171' : 'var(--t2)' }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? 'var(--a-bg)' : 'transparent'; e.currentTarget.style.color = active ? 'var(--a)' : 'var(--t4)' }}>
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">{children}</svg>
    </button>
  )
}

function relTime(ts) {
  if (!ts) return ''
  const d = Date.now() - ts
  if (d < 60000)    return 'just now'
  if (d < 3600000)  return `${Math.floor(d / 60000)}m ago`
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`
  return new Date(ts).toLocaleDateString()
}

function normalizeOllama(rawUrl) {
  let url = String(rawUrl || '').trim()
  if (!url) url = 'http://localhost:11434'
  return url.replace(/\/+$/, '').replace(/\/(v1|api)$/i, '')
}
