import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { streamAI, MODELS } from './useAIStream'
import MarkdownMessage from './MarkdownMessage'

// ─────────────────────────────────────────────────────────────────────────────
// Provider config
// ─────────────────────────────────────────────────────────────────────────────
const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    color: '#10A37F',
    bg: 'rgba(16,163,127,0.1)',
    Logo: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.28 9.78a5.74 5.74 0 0 0-.49-4.73 5.85 5.85 0 0 0-6.3-2.8 5.74 5.74 0 0 0-4.32-1.93 5.85 5.85 0 0 0-5.58 4.05 5.74 5.74 0 0 0-3.83 2.78 5.85 5.85 0 0 0 .72 6.87 5.74 5.74 0 0 0 .49 4.73 5.85 5.85 0 0 0 6.3 2.8 5.74 5.74 0 0 0 4.32 1.93 5.85 5.85 0 0 0 5.58-4.05 5.74 5.74 0 0 0 3.83-2.78 5.85 5.85 0 0 0-.72-6.87zM13.18 20.9a4.33 4.33 0 0 1-2.78-.99l.14-.08 4.61-2.66a.76.76 0 0 0 .38-.66v-6.51l1.95 1.13a.07.07 0 0 1 .04.05v5.38a4.35 4.35 0 0 1-4.34 4.34zM3.73 17.1a4.33 4.33 0 0 1-.52-2.91l.14.08 4.61 2.66a.76.76 0 0 0 .76 0l5.63-3.25v2.26a.07.07 0 0 1-.03.06L9.65 18.6a4.35 4.35 0 0 1-5.92-1.5zM2.9 8.26A4.33 4.33 0 0 1 5.16 6.1v5.46a.76.76 0 0 0 .38.66l5.63 3.25-1.95 1.13a.07.07 0 0 1-.07 0L4.52 13.8A4.35 4.35 0 0 1 2.9 8.26zm16.03 3.74-5.63-3.25 1.95-1.13a.07.07 0 0 1 .07 0l4.63 2.67a4.35 4.35 0 0 1-.67 7.85v-5.46a.76.76 0 0 0-.35-.68zm1.94-2.93-.14-.08-4.61-2.66a.76.76 0 0 0-.76 0L9.73 9.58V7.32a.07.07 0 0 1 .03-.06l4.63-2.67a4.35 4.35 0 0 1 6.48 4.48zM8.72 12.82l-1.95-1.13a.07.07 0 0 1-.04-.05V6.26a4.35 4.35 0 0 1 7.13-3.34l-.14.08-4.61 2.66a.76.76 0 0 0-.38.66l-.01 6.5zm1.06-2.28 2.5-1.44 2.5 1.44v2.88l-2.5 1.44-2.5-1.44V10.54z"/>
      </svg>
    ),
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    color: '#D97706',
    bg: 'rgba(217,119,6,0.1)',
    Logo: () => (
      <svg width="18" height="18" viewBox="0 0 92 65" fill="currentColor">
        <path d="M66.5 0H52.4L92 65h14.1L66.5 0ZM25.5 0 0 65h14.4l5.2-13.4h26.5L51.3 65h14.4L40.2 0H25.5Zm-1.8 39.9 9.3-23.7 9.3 23.7H23.7Z" transform="scale(0.85) translate(5, 3)"/>
      </svg>
    ),
  },
  {
    id: 'gemini',
    name: 'Google',
    color: '#4285F4',
    bg: 'rgba(66,133,244,0.1)',
    Logo: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: 'ollama',
    name: 'Ollama',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.1)',
    Logo: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
  ollama:    null, // free input
}

const SUGGESTIONS = [
  { icon: '🗂', text: 'Summarize all my open tabs' },
  { icon: '🎯', text: 'What should I focus on?' },
  { icon: '✍️', text: 'Help me write a brief on this research' },
  { icon: '🔍', text: 'Find connections between my tabs' },
]

// ─────────────────────────────────────────────────────────────────────────────
// AI Icon — custom constellation / neural mark
// ─────────────────────────────────────────────────────────────────────────────
export function AIIcon({ size = 16, color = 'currentColor', glow = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={glow ? { filter: `drop-shadow(0 0 4px ${color})` } : {}}>
      <circle cx="10" cy="4"  r="2"   fill={color}/>
      <circle cx="4"  cy="14" r="2"   fill={color} opacity="0.8"/>
      <circle cx="16" cy="14" r="2"   fill={color} opacity="0.8"/>
      <circle cx="10" cy="11" r="1.4" fill={color} opacity="0.5"/>
      <line x1="10" y1="6"  x2="10" y2="9.6" stroke={color} strokeWidth="1.2" opacity="0.4"/>
      <line x1="10" y1="12.4" x2="5.4" y2="13.3"  stroke={color} strokeWidth="1.2" opacity="0.4"/>
      <line x1="10" y1="12.4" x2="14.6" y2="13.3" stroke={color} strokeWidth="1.2" opacity="0.4"/>
      <line x1="8.3" y1="5"  x2="5"  y2="12.4" stroke={color} strokeWidth="1.1" opacity="0.25"/>
      <line x1="11.7" y1="5" x2="15" y2="12.4" stroke={color} strokeWidth="1.1" opacity="0.25"/>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel
// ─────────────────────────────────────────────────────────────────────────────
const W = 336

export default function AIPanel() {
  const store = useWorkspaceStore()
  const {
    isAIPanelOpen, toggleAIPanel,
    aiConversations, aiCurrentId,
    aiProvider, setAIProvider,
    aiContextEnabled, setAIContextEnabled,
    aiNewChat, aiSelectConv, aiDeleteConv,
    aiCurrentMessages, aiPushMessage, aiUpdateLastMessage,
    addIdeNode, nodes, theme, activeWorkspaceId, getActiveWorkspace
  } = store

  const activeWorkspace = getActiveWorkspace()

  const [tab, setTab]           = useState('chat')   // 'chat' | 'history' | 'settings'
  const [input, setInput]       = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError]       = useState(null)
  const abortRef  = useRef(null)
  const bottomRef = useRef(null)
  const taRef     = useRef(null)
  const isDark    = theme === 'dark'

  const messages = aiCurrentMessages()
  const activeProv = PROVIDERS.find(p => p.id === aiProvider.active) || PROVIDERS[0]
  const activeProvCfg = aiProvider[aiProvider.active] || {}

  // Ensure a conversation exists when opening
  useEffect(() => {
    if (isAIPanelOpen && aiConversations.length === 0) aiNewChat()
    if (isAIPanelOpen && aiConversations.length > 0 && !aiCurrentId) aiSelectConv(aiConversations[0].id)
  }, [isAIPanelOpen])

  // Scroll to bottom
  useEffect(() => {
    if (tab === 'chat') bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, tab])

  // Auto-grow textarea
  useEffect(() => {
    if (!taRef.current) return
    taRef.current.style.height = 'auto'
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 128) + 'px'
  }, [input])

  // Workspace context builder
  const buildContext = useCallback(() => {
    const wsNodes = nodes.filter(n => n.data?.workspaceId === activeWorkspaceId || (!activeWorkspaceId && !n.data?.workspaceId))
    const tabs = wsNodes.filter(n => n.type === 'webNode')
    const ideCount = wsNodes.filter(n => n.type === 'ideNode').length
    const list = tabs.map((n, i) =>
      `${i+1}. "${n.data.title || 'Untitled'}" - ${n.data.url}${n.data.note ? ` [note: ${n.data.note}]` : ''}`
    ).join('\n') || 'No web cards are currently open in this workspace.'
    return `You are an AI assistant embedded in Canvascape, a spatial canvas browser where websites and live IDE cards exist on an infinite canvas.\n\nThe user is currently in the "${activeWorkspace?.label || 'Default'}" workspace and has ${tabs.length} web card${tabs.length > 1 ? 's' : ''} open:\n${list}\n\nThey also have ${ideCount} live IDE card${ideCount === 1 ? '' : 's'} in this workspace.\n\nWhen the user asks to create a webpage or website, return complete HTML inside one \`\`\`html code block.\nBe concise, helpful, and workspace-aware.`
  }, [nodes, activeWorkspaceId, activeWorkspace])

  const send = useCallback(async (overrideText) => {
    const text = (overrideText ?? input).trim()
    if (!text || streaming) return
    setInput('')
    setError(null)

    // Ensure conversation
    if (!aiCurrentId) { aiNewChat(); return }

    const userMsg = { id: `m_${Date.now()}`, role: 'user', content: text, ts: Date.now() }
    aiPushMessage(userMsg)
    const asstMsg = { id: `m_${Date.now()+1}`, role: 'assistant', content: '', ts: Date.now() }
    aiPushMessage(asstMsg)
    setStreaming(true)

    // Build API messages
    const apiMsgs = []
    if (aiContextEnabled) {
      const ctx = buildContext()
      if (ctx) apiMsgs.push({ role: 'system', content: ctx })
    }
    const history = aiCurrentMessages().slice(0, -2).slice(-16)
    history.forEach(m => { if (m.role === 'user' || m.role === 'assistant') apiMsgs.push({ role: m.role, content: m.content }) })
    apiMsgs.push({ role: 'user', content: text })

    const provCfg = aiProvider[aiProvider.active]
    abortRef.current = new AbortController()
    let acc = ''

    await streamAI({
      provider: { name: aiProvider.active, ...provCfg },
      messages: apiMsgs,
      signal: abortRef.current.signal,
      onChunk: c => { acc += c; aiUpdateLastMessage(acc) },
      onDone:  () => {
        setStreaming(false)
        abortRef.current = null
        const html = extractHtmlDoc(acc)
        if (html) {
          const title = extractHtmlTitle(html) || inferPageTitle(text)
          addIdeNode({ title, html })
        }
      },
      onError: msg => {
        setError(msg)
        aiUpdateLastMessage(`⚠️ ${msg}`)
        setStreaming(false)
        abortRef.current = null
      },
    })
  }, [input, streaming, aiCurrentId, aiProvider, aiContextEnabled, buildContext, aiPushMessage, aiUpdateLastMessage, aiCurrentMessages, aiNewChat, addIdeNode])

  const stop = () => { abortRef.current?.abort(); setStreaming(false) }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
    e.stopPropagation()
  }

  const startNewChat = () => { aiNewChat(); setTab('chat') }
  const openConv = (id) => { aiSelectConv(id); setTab('chat') }

  // ── render ───────────────────────────────────────────────────────────────
  const d = isDark   // shorthand
  const surface = d ? '#141310' : '#FAFAF7'
  const border  = d ? 'rgba(255,245,220,0.08)' : 'rgba(100,80,40,0.1)'
  const s2      = d ? '#1A1916' : '#F2EFE8'
  const s3      = d ? '#22211D' : '#E8E4DA'

  return (
    <AnimatePresence>
    {isAIPanelOpen && (
      <motion.div
        key="aipanel"
        initial={{ x: W + 12, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: W + 12, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 38 }}
        style={{
          position: 'fixed', top: 72, right: 14, bottom: 14, zIndex: 200,
          width: `min(${W}px, calc(100vw - 28px))`, maxHeight: 'calc(100vh - 86px)',
          display: 'flex', flexDirection: 'column',
          background: surface, border: `1px solid ${border}`, borderRadius: 14,
          boxShadow: d ? '-10px 14px 48px rgba(0,0,0,0.5)' : '-8px 10px 30px rgba(0,0,0,0.08)',
          fontFamily: "'DM Sans', sans-serif",
          overflow: 'hidden',
        }}
      >
        {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', height: 54, flexShrink: 0, borderBottom: `1px solid ${border}` }}>

          {/* Icon + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--a-bg)', border: '1px solid var(--bd-a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AIIcon size={16} color="var(--a)"/>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em', lineHeight: 1.2 }}>AI Assistant</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: activeProv.color, flexShrink: 0 }}/>
                <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>{activeProv.name} · {activeProvCfg.model}</span>
              </div>
            </div>
          </div>

          {/* Canvas context badge */}
          <button
            onClick={() => setAIContextEnabled(!aiContextEnabled)}
            title={aiContextEnabled ? 'Canvas context on' : 'Canvas context off'}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px',
              borderRadius: 8, border: `1px solid ${aiContextEnabled ? 'var(--bd-a)' : border}`,
              background: aiContextEnabled ? 'var(--a-bg)' : 'transparent',
              color: aiContextEnabled ? 'var(--a)' : 'var(--t4)',
              cursor: 'pointer', fontSize: 10.5, fontWeight: 600, fontFamily: 'inherit',
              transition: 'all 150ms',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
              <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" opacity="0.5"/>
              <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" opacity="0.5"/>
              <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" opacity="0.25"/>
            </svg>
            Canvas
          </button>

          {/* New chat */}
          <HdrBtn onClick={startNewChat} title="New chat" d={d}>
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </HdrBtn>

          {/* Close */}
          <HdrBtn onClick={toggleAIPanel} title="Close (Ctrl+Shift+A)" d={d}>
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </HdrBtn>
        </div>

        {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait">
            {tab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <ChatView messages={messages} streaming={streaming} onSuggest={t => send(t)} isDark={d} bottomRef={bottomRef}/>
              </motion.div>
            )}
            {tab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} style={{ flex: 1, overflow: 'hidden' }}>
                <HistoryView convs={aiConversations} currentId={aiCurrentId} onOpen={openConv} onDelete={id => { aiDeleteConv(id) }} isDark={d} border={border} s2={s2}/>
              </motion.div>
            )}
            {tab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} style={{ flex: 1, overflow: 'hidden' }}>
                <SettingsView provider={aiProvider} setProvider={setAIProvider} isDark={d} border={border} s2={s2} s3={s3}/>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── INPUT (only in chat tab) ─────────────────────────────────────── */}
        {tab === 'chat' && (
          <div style={{ flexShrink: 0, padding: '10px 12px 12px', borderTop: `1px solid ${border}` }}>
            {error && (
              <div style={{ marginBottom: 8, padding: '7px 10px', borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11.5, color: '#F87171', display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
                <span style={{ flex: 1, lineHeight: 1.5 }}>{error}</span>
                <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F87171', fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
              </div>
            )}
            <div style={{
              borderRadius: 14, border: `1.5px solid ${border}`,
              background: d ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.02)',
              transition: 'border-color 150ms',
            }}>
              <textarea
                ref={taRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Message AI…"
                rows={1}
                style={{
                  width: '100%', resize: 'none', border: 'none', outline: 'none',
                  background: 'transparent', padding: '11px 14px 0',
                  color: 'var(--t1)', fontSize: 13.5, lineHeight: 1.55,
                  fontFamily: 'inherit', boxSizing: 'border-box',
                  minHeight: 22, maxHeight: 128, overflow: 'auto',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px 8px' }}>
                <span style={{ fontSize: 10, color: 'var(--t4)' }}>↵ send  ⇧↵ newline</span>
                {streaming ? (
                  <button onClick={stop} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#F87171', fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                    <span style={{ width: 6, height: 6, borderRadius: 1.5, background: '#F87171' }}/>
                    Stop
                  </button>
                ) : (
                  <button onClick={() => send()} disabled={!input.trim()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, border: `1px solid ${input.trim() ? 'var(--bd-a)' : border}`, background: input.trim() ? 'var(--a-bg)' : 'transparent', color: input.trim() ? 'var(--a)' : 'var(--t4)', fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit', cursor: input.trim() ? 'pointer' : 'default', transition: 'all 140ms' }}>
                    Send
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── BOTTOM NAV ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', borderTop: `1px solid ${border}`, flexShrink: 0 }}>
          {[
            { id: 'chat',     label: 'Chat',     icon: <ChatNavIcon/> },
            { id: 'history',  label: 'History',  icon: <HistoryNavIcon/> },
            { id: 'settings', label: 'Settings', icon: <SettingsNavIcon/> },
          ].map(item => {
            const active = tab === item.id
            return (
              <button key={item.id} onClick={() => setTab(item.id)} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 3, height: 52, border: 'none', background: 'transparent',
                color: active ? 'var(--a)' : 'var(--t3)', cursor: 'pointer',
                fontFamily: 'inherit', transition: 'color 140ms', position: 'relative',
              }}>
                {active && (
                  <motion.div layoutId="nav-pill" style={{ position: 'absolute', top: 0, left: 12, right: 12, height: 2, borderRadius: '0 0 2px 2px', background: 'var(--a)' }}/>
                )}
                <div style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
                <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: '0.03em' }}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </motion.div>
    )}
    </AnimatePresence>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat view
// ─────────────────────────────────────────────────────────────────────────────
function ChatView({ messages, streaming, onSuggest, isDark, bottomRef }) {
  const isEmpty = messages.length === 0
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 10, scrollbarWidth: 'thin' }}>
      {isEmpty ? (
        <EmptyChat isDark={isDark} onSuggest={onSuggest}/>
      ) : (
        messages.map((msg, i) => (
          <MessageBubble key={msg.id} msg={msg} isDark={isDark} isStreaming={streaming && i === messages.length - 1 && msg.role === 'assistant'}/>
        ))
      )}
      <div ref={bottomRef}/>
    </div>
  )
}

function EmptyChat({ isDark, onSuggest }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 12px', gap: 24 }}>
      {/* Animated icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--a-bg)', border: '1.5px solid var(--bd-a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <AIIcon size={24} color="var(--a)" glow/>
      </motion.div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em', marginBottom: 6 }}>Ask anything</div>
        <div style={{ fontSize: 12.5, color: 'var(--t3)', lineHeight: 1.6 }}>Your AI assistant with full canvas context</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
        {SUGGESTIONS.map(s => (
          <motion.button
            key={s.text}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onSuggest(s.text)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              borderRadius: 12, border: isDark ? '1px solid rgba(255,245,220,0.07)' : '1px solid rgba(100,80,40,0.1)',
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              color: 'var(--t2)', fontSize: 12.5, fontFamily: 'inherit', cursor: 'pointer',
              textAlign: 'left', transition: 'all 130ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bd-a)'; e.currentTarget.style.background = 'var(--a-bg)'; e.currentTarget.style.color = 'var(--a)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(255,245,220,0.07)' : 'rgba(100,80,40,0.1)'; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'; e.currentTarget.style.color = 'var(--t2)' }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
            {s.text}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function MessageBubble({ msg, isDark, isStreaming }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'

  const copy = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 4 }}
    >
      {/* Role */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: isUser ? 0 : 2, paddingRight: isUser ? 2 : 0 }}>
        {!isUser && (
          <div style={{ width: 16, height: 16, borderRadius: 5, background: 'var(--a-bg)', border: '1px solid var(--bd-a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AIIcon size={9} color="var(--a)"/>
          </div>
        )}
        <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600, letterSpacing: '0.04em' }}>{isUser ? 'You' : 'AI'}</span>
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '94%', padding: '9px 13px',
        borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
        background: isUser
          ? (isDark ? 'rgba(245,158,11,0.1)' : 'rgba(217,119,6,0.07)')
          : (isDark ? '#1A1916' : '#F2EFE8'),
        border: isUser
          ? '1px solid var(--bd-a)'
          : `1px solid ${isDark ? 'rgba(255,245,220,0.07)' : 'rgba(100,80,40,0.1)'}`,
      }}>
        {msg.content
          ? <MarkdownMessage content={msg.content}/>
          : isStreaming
            ? <ThinkDots/>
            : null
        }
        {isStreaming && msg.content && (
          <span style={{ display: 'inline-block', width: 2, height: 12, background: 'var(--a)', borderRadius: 1, marginLeft: 2, verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }}/>
        )}
      </div>

      {/* Copy */}
      {!isUser && msg.content && !isStreaming && (
        <button onClick={copy} title={copied ? 'Copied' : 'Copy'} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 6, border: '1px solid var(--bd)', background: 'transparent', color: 'var(--t3)', fontSize: 10.5, fontFamily: 'inherit', cursor: 'pointer', marginLeft: 2, transition: 'all 120ms' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--s3)'; e.currentTarget.style.color = 'var(--t2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t3)' }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      )}
    </motion.div>
  )
}

function ThinkDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--a)', opacity: 0.4, animation: `bounce 1.1s ease-in-out ${i*0.18}s infinite` }}/>
      ))}
      <style>{'@keyframes bounce{0%,80%,100%{transform:scale(0.6);opacity:.3}40%{transform:scale(1);opacity:.9}} @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}'}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// History view
// ─────────────────────────────────────────────────────────────────────────────
function HistoryView({ convs, currentId, onOpen, onDelete, isDark, border, s2 }) {
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 6, scrollbarWidth: 'thin' }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 4 }}>Conversation history</div>
      {convs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--t3)', fontSize: 13 }}>No conversations yet</div>
      )}
      {convs.map(conv => {
        const isActive = conv.id === currentId
        const preview  = conv.messages.find(m => m.role === 'assistant')?.content?.slice(0, 72) || 'No response yet'
        return (
          <motion.div key={conv.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => onOpen(conv.id)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 13px',
              borderRadius: 12, cursor: 'pointer', border: `1px solid ${isActive ? 'var(--bd-a)' : border}`,
              background: isActive ? 'var(--a-bg)' : (isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.02)'),
              transition: 'all 130ms', position: 'relative',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.02)' }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, background: isActive ? 'var(--a-bg)' : s2, border: `1px solid ${isActive ? 'var(--bd-a)' : border}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M3 3h10v7H8l-2 3v-3H3V3z" stroke={isActive ? 'var(--a)' : 'var(--t3)'} strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: isActive ? 'var(--a)' : 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{conv.title}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>{preview}</div>
              <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 4 }}>{relTime(conv.updatedAt)} · {conv.messages.length} msg{conv.messages.length !== 1 ? 's' : ''}</div>
            </div>
            <button onClick={e => { e.stopPropagation(); onDelete(conv.id) }}
              style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--t4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'all 120ms' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#F87171' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '0' }}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4.5 3V2h3v1M3.5 3l.5 7h4l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </motion.div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings view
// ─────────────────────────────────────────────────────────────────────────────
function SettingsView({ provider, setProvider, isDark, border, s2, s3 }) {
  const [active, setActive] = useState(provider.active)
  const [ollamaModels, setOllamaModels] = useState([])
  const [isDetectingModels, setIsDetectingModels] = useState(false)
  const [detectModelsError, setDetectModelsError] = useState('')
  const prov = PROVIDERS.find(p => p.id === active) || PROVIDERS[0]
  const cfg  = provider[active] || {}
  const models = MODEL_OPTIONS[active]

  const update = (key, val) => {
    setProvider({ [active]: { ...provider[active], [key]: val } })
  }
  const switchProvider = (id) => {
    setActive(id)
    setProvider({ active: id })
  }

  const detectOllamaModels = async () => {
    if (active !== 'ollama') return
    const baseUrl = normalizeOllamaBaseUrl(cfg.baseUrl || 'http://localhost:11434')

    setIsDetectingModels(true)
    setDetectModelsError('')

    try {
      let names = []
      const tagsRes = await fetch(`${baseUrl}/api/tags`)

      if (tagsRes.ok) {
        const body = await tagsRes.json().catch(() => ({}))
        names = (body.models || []).map((m) => m?.name).filter(Boolean)
      } else if (tagsRes.status === 404) {
        const v1Res = await fetch(`${baseUrl}/v1/models`)
        if (!v1Res.ok) throw new Error(`Ollama ${v1Res.status}: ${v1Res.statusText}`)
        const body = await v1Res.json().catch(() => ({}))
        names = (body.data || []).map((m) => m?.id).filter(Boolean)
      } else {
        throw new Error(`Ollama ${tagsRes.status}: ${tagsRes.statusText}`)
      }

      const unique = [...new Set(names)]
      setOllamaModels(unique)

      if (!cfg.model && unique.length > 0) {
        setProvider({ ollama: { ...provider.ollama, model: unique[0] } })
      }
      if (unique.length === 0) {
        setDetectModelsError('No models found. Pull one with: ollama pull <model>')
      }
    } catch (err) {
      setOllamaModels([])
      setDetectModelsError(err?.message || 'Could not detect models from Ollama endpoint.')
    } finally {
      setIsDetectingModels(false)
    }
  }

  useEffect(() => {
    if (active !== 'ollama') return
    const t = setTimeout(() => { detectOllamaModels() }, 500)
    return () => clearTimeout(t)
  }, [active, cfg.baseUrl])

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 20, scrollbarWidth: 'thin' }}>

      {/* Provider grid */}
      <div>
        <Label>Provider</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {PROVIDERS.map(p => {
            const isA = active === p.id
            return (
              <button key={p.id} onClick={() => switchProvider(p.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 6px',
                  borderRadius: 12, border: `1.5px solid ${isA ? p.color + '70' : border}`,
                  background: isA ? p.bg : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                  color: isA ? p.color : 'var(--t3)', cursor: 'pointer', transition: 'all 140ms', fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (!isA) { e.currentTarget.style.border = `1.5px solid ${p.color}40`; e.currentTarget.style.background = p.bg } }}
                onMouseLeave={e => { if (!isA) { e.currentTarget.style.border = `1.5px solid ${border}`; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' } }}
              >
                <div style={{ color: isA ? p.color : 'var(--t3)' }}><p.Logo/></div>
                <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.02em', lineHeight: 1 }}>{p.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: border }}/>

      {/* Active provider config */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: prov.bg, border: `1.5px solid ${prov.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: prov.color }}><prov.Logo/></div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', fontFamily: "'Syne', sans-serif" }}>{prov.name} Settings</span>
        </div>

        {/* API Key */}
        {active !== 'ollama' && (
          <div>
            <Label>API Key</Label>
            <input type="password" value={cfg.apiKey || ''} onChange={e => update('apiKey', e.target.value)}
              placeholder={`${prov.name} API key…`}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1px solid ${border}`, outline: 'none', background: s2, color: 'var(--t1)', fontSize: 12.5, fontFamily: "'DM Mono', monospace", boxSizing: 'border-box', transition: 'border-color 140ms' }}
              onFocus={e => e.target.style.borderColor = 'var(--bd-a)'}
              onBlur={e  => e.target.style.borderColor = border}
            />
          </div>
        )}

        {/* Ollama endpoint */}
        {active === 'ollama' && (
          <div>
            <Label>Endpoint URL</Label>
            <input type="text" value={cfg.baseUrl || ''} onChange={e => update('baseUrl', e.target.value)}
              placeholder="http://localhost:11434"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1px solid ${border}`, outline: 'none', background: s2, color: 'var(--t1)', fontSize: 12.5, fontFamily: "'DM Mono', monospace", boxSizing: 'border-box', transition: 'border-color 140ms' }}
              onFocus={e => e.target.style.borderColor = 'var(--bd-a)'}
              onBlur={e  => e.target.style.borderColor = border}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <button
                onClick={detectOllamaModels}
                disabled={isDetectingModels}
                style={{
                  padding: '5px 10px',
                  borderRadius: 8,
                  border: `1px solid ${border}`,
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                  color: 'var(--t2)',
                  fontSize: 11,
                  fontFamily: "'DM Mono', monospace",
                  cursor: isDetectingModels ? 'default' : 'pointer',
                  opacity: isDetectingModels ? 0.7 : 1,
                }}
              >
                {isDetectingModels ? 'Detecting…' : 'Detect Models'}
              </button>
              <span style={{ fontSize: 11, color: detectModelsError ? '#F87171' : 'var(--t3)' }}>
                {detectModelsError || (ollamaModels.length ? `${ollamaModels.length} model${ollamaModels.length > 1 ? 's' : ''} detected` : '')}
              </span>
            </div>
          </div>
        )}

        {/* Model */}
        <div>
          <Label>Model</Label>
          {models ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {models.map(m => {
                const isSel = cfg.model === m
                return (
                  <button key={m} onClick={() => update('model', m)}
                    style={{ padding: '5px 11px', borderRadius: 8, fontSize: 11.5, fontFamily: "'DM Mono', monospace", border: `1px solid ${isSel ? 'var(--bd-a)' : border}`, background: isSel ? 'var(--a-bg)' : s2, color: isSel ? 'var(--a)' : 'var(--t2)', cursor: 'pointer', transition: 'all 120ms' }}>
                    {m}
                  </button>
                )
              })}
            </div>
          ) : (
            <input type="text" value={cfg.model || ''} onChange={e => update('model', e.target.value)}
              placeholder="e.g. llama3.2, mistral, gemma2"
              list="ollama-models"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1px solid ${border}`, outline: 'none', background: s2, color: 'var(--t1)', fontSize: 12.5, fontFamily: "'DM Mono', monospace", boxSizing: 'border-box', transition: 'border-color 140ms' }}
              onFocus={e => e.target.style.borderColor = 'var(--bd-a)'}
              onBlur={e  => e.target.style.borderColor = border}
            />
          )}
          <datalist id="ollama-models">
            {(ollamaModels.length ? ollamaModels : ['llama3.2','llama3.1','mistral','gemma2','qwen2.5','phi3','deepseek-r1','codellama']).map(m => <option key={m} value={m}/>)}
          </datalist>
          {active === 'ollama' && ollamaModels.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {ollamaModels.slice(0, 12).map(m => {
                const isSel = cfg.model === m
                return (
                  <button
                    key={m}
                    onClick={() => update('model', m)}
                    style={{
                      padding: '4px 9px',
                      borderRadius: 999,
                      border: `1px solid ${isSel ? 'var(--bd-a)' : border}`,
                      background: isSel ? 'var(--a-bg)' : s2,
                      color: isSel ? 'var(--a)' : 'var(--t2)',
                      fontSize: 10.5,
                      fontFamily: "'DM Mono', monospace",
                      cursor: 'pointer',
                    }}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Security note */}
        <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--a-bg)', border: '1px solid var(--bd-a)', fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ flexShrink: 0 }}>🔒</span>
          <span>Keys are stored only in your local workspace file and never sent anywhere except the provider API directly.</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────
function Label({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>{children}</div>
}

function HdrBtn({ onClick, title, d, children }) {
  return (
    <button onClick={onClick} title={title}
      style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 130ms', padding: 0, flexShrink: 0 }}
      onMouseEnter={e => { e.currentTarget.style.background = d ? 'rgba(255,245,220,0.06)' : 'rgba(100,80,40,0.07)'; e.currentTarget.style.color = 'var(--t2)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t3)' }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">{children}</svg>
    </button>
  )
}

function relTime(ts) {
  if (!ts) return ''
  const d = Date.now() - ts
  if (d < 60000)   return 'just now'
  if (d < 3600000) return `${Math.floor(d/60000)}m ago`
  if (d < 86400000) return `${Math.floor(d/3600000)}h ago`
  return new Date(ts).toLocaleDateString()
}

function normalizeOllamaBaseUrl(rawUrl) {
  let url = String(rawUrl || '').trim()
  if (!url) url = 'http://localhost:11434'
  url = url.replace(/\/+$/, '')
  return url.replace(/\/(v1|api)$/i, '')
}

function extractHtmlDoc(text) {
  if (!text) return ''
  const htmlFence = text.match(/```html\s*([\s\S]*?)```/i)
  if (htmlFence?.[1]) return htmlFence[1].trim()

  const anyFence = text.match(/```[\w-]*\s*([\s\S]*?)```/)
  if (anyFence?.[1] && /<html|<!doctype html|<body/i.test(anyFence[1])) {
    return anyFence[1].trim()
  }

  if (/<html|<!doctype html/i.test(text)) return text.trim()
  return ''
}

function extractHtmlTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i)
  return m?.[1]?.trim() || ''
}

function inferPageTitle(prompt) {
  const p = (prompt || '').trim()
  if (!p) return 'Generated Webpage'
  if (/portfolio/i.test(p)) return 'Generated Portfolio'
  if (/landing/i.test(p)) return 'Generated Landing Page'
  if (/e-?commerce|store/i.test(p)) return 'Generated Storefront'
  return 'Generated Webpage'
}

// Nav icons
function ChatNavIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3h10v7H8.5l-2 2.5V10H3V3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
}
function HistoryNavIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5.5V8l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function SettingsNavIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.5 3.5l1 1M11.5 11.5l1 1M3.5 12.5l1-1M11.5 4.5l1-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
}


