/**
 * useAIStream — unified streaming for OpenAI, Anthropic, Gemini, Ollama
 * messages format: [{ role: 'system'|'user'|'assistant', content: string }]
 */

export const MODELS = {
  openai:    ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o3-mini'],
  anthropic: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
  gemini:    ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  ollama:    [], // user types model name
}

export async function streamAI({ provider, messages, onChunk, onDone, onError, signal }) {
  try {
    switch (provider.name) {
      case 'openai':    return await _streamOpenAI(provider, messages, onChunk, onDone, signal)
      case 'anthropic': return await _streamAnthropic(provider, messages, onChunk, onDone, signal)
      case 'gemini':    return await _streamGemini(provider, messages, onChunk, onDone, signal)
      case 'ollama':    return await _streamOllama(provider, messages, onChunk, onDone, signal)
      default: throw new Error(`Unknown provider: ${provider.name}`)
    }
  } catch (err) {
    if (err.name === 'AbortError') { onDone?.(); return }
    onError?.(err.message || 'Stream failed')
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns a guard that ensures onDone fires exactly once */
function onceDone(fn) {
  let called = false
  return () => { if (!called) { called = true; fn?.() } }
}

async function _readSSE(body, onData) {
  const reader  = body.getReader()
  const decoder = new TextDecoder()
  let buffer    = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (line.startsWith('data: ')) onData(line.slice(6).trim())
    }
  }
}

// ── OpenAI ────────────────────────────────────────────────────────────────────
async function _streamOpenAI(provider, messages, onChunk, onDone, signal) {
  if (!provider.apiKey) throw new Error('OpenAI API key is not set. Open Settings → API Key.')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', signal,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model || 'gpt-4o',
      messages,
      stream: true,
      max_tokens: 2048,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message || `OpenAI ${res.status}: ${res.statusText}`)
  }

  const done = onceDone(onDone)
  await _readSSE(res.body, (data) => {
    if (data === '[DONE]') { done(); return }
    try {
      const j     = JSON.parse(data)
      const chunk = j.choices?.[0]?.delta?.content
      if (chunk) onChunk(chunk)
    } catch { /* ignore malformed lines */ }
  })
  done() // fallback — fires only if [DONE] was never sent
}

// ── Anthropic ─────────────────────────────────────────────────────────────────
async function _streamAnthropic(provider, messages, onChunk, onDone, signal) {
  if (!provider.apiKey) throw new Error('Anthropic API key is not set. Open Settings → API Key.')

  const systemMsg = messages.find(m => m.role === 'system')
  const chatMsgs  = messages.filter(m => m.role !== 'system')

  const body = {
    model:      provider.model || 'claude-sonnet-4-5',
    max_tokens: 2048,
    messages:   chatMsgs,
    stream:     true,
  }
  if (systemMsg) body.system = systemMsg.content

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', signal,
    headers: {
      'Content-Type':  'application/json',
      'x-api-key':     provider.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Anthropic ${res.status}: ${res.statusText}`)
  }

  const done = onceDone(onDone)
  await _readSSE(res.body, (data) => {
    try {
      const j = JSON.parse(data)
      if (j.type === 'content_block_delta' && j.delta?.type === 'text_delta') {
        onChunk(j.delta.text)
      }
      if (j.type === 'message_stop') done()
    } catch { /* ignore */ }
  })
  done()
}

// ── Gemini ────────────────────────────────────────────────────────────────────
async function _streamGemini(provider, messages, onChunk, onDone, signal) {
  if (!provider.apiKey) throw new Error('Google API key is not set. Open Settings → API Key.')

  const model     = provider.model || 'gemini-2.0-flash'
  const systemMsg = messages.find(m => m.role === 'system')
  const chatMsgs  = messages.filter(m => m.role !== 'system')

  // Gemini requires alternating user/model turns — merge consecutive same-role messages
  const merged = []
  for (const m of chatMsgs) {
    const role = m.role === 'assistant' ? 'model' : 'user'
    if (merged.length > 0 && merged[merged.length - 1].role === role) {
      merged[merged.length - 1].parts[0].text += '\n' + m.content
    } else {
      merged.push({ role, parts: [{ text: m.content }] })
    }
  }

  // Gemini requires first message to be 'user'
  if (merged.length === 0 || merged[0].role !== 'user') {
    merged.unshift({ role: 'user', parts: [{ text: ' ' }] })
  }

  const reqBody = { contents: merged }
  if (systemMsg) reqBody.systemInstruction = { parts: [{ text: systemMsg.content }] }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${provider.apiKey}&alt=sse`
  const res = await fetch(url, {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Gemini ${res.status}: ${res.statusText}`)
  }

  const done = onceDone(onDone)
  await _readSSE(res.body, (data) => {
    try {
      const j    = JSON.parse(data)
      const text = j.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) onChunk(text)
      if (j.candidates?.[0]?.finishReason) done()
    } catch { /* ignore */ }
  })
  done()
}

// ── Ollama ────────────────────────────────────────────────────────────────────
async function _streamOllama(provider, messages, onChunk, onDone, signal) {
  const baseUrl = _normalizeOllamaBaseUrl(provider.baseUrl || 'http://localhost:11434')
  const model   = provider.model || 'llama3.2'

  let res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
  }).catch(() => { throw new Error(`Cannot connect to Ollama at ${baseUrl}. Is it running?`) })

  // Some setups expose Ollama via OpenAI-compatible endpoint only.
  if (res.status === 404) {
    res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST', signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: true }),
    }).catch(() => { throw new Error(`Cannot connect to Ollama at ${baseUrl}. Is it running?`) })

    if (!res.ok) {
      const details = await _readErrorText(res)
      throw new Error(details || `Ollama ${res.status}: ${res.statusText}`)
    }

    const done = onceDone(onDone)
    await _readSSE(res.body, (data) => {
      if (data === '[DONE]') { done(); return }
      try {
        const j = JSON.parse(data)
        const chunk = j.choices?.[0]?.delta?.content
        if (chunk) onChunk(chunk)
      } catch { /* ignore malformed lines */ }
    })
    done()
    return
  }

  if (!res.ok) {
    const details = await _readErrorText(res)
    throw new Error(details || `Ollama ${res.status}: ${res.statusText}`)
  }

  const done    = onceDone(onDone)
  const reader  = res.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done: streamDone, value } = await reader.read()
    if (streamDone) break
    const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean)
    for (const line of lines) {
      try {
        const j = JSON.parse(line)
        if (j.message?.content) onChunk(j.message.content)
        if (j.done) done()
      } catch { /* ignore */ }
    }
  }
  done()
}

function _normalizeOllamaBaseUrl(rawUrl) {
  let url = String(rawUrl || '').trim()
  if (!url) url = 'http://localhost:11434'
  url = url.replace(/\/+$/, '')
  // Prevent accidental paths like /v1 or /api causing /v1/api/chat 404.
  url = url.replace(/\/(v1|api)$/i, '')
  return url
}

async function _readErrorText(res) {
  const text = await res.text().catch(() => '')
  if (!text) return ''
  try {
    const j = JSON.parse(text)
    return j.error?.message || j.error || text
  } catch {
    return text
  }
}
