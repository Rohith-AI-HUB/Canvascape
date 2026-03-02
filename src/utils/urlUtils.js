export function normalizeUrl(input) {
  const trimmed = (input || '').trim()
  if (!trimmed) return 'https://www.google.com'
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^[\w-]+\.[a-z]{2,}(\/|$)/i.test(trimmed) || /^localhost(:\d+)?/i.test(trimmed)) {
    return `https://${trimmed}`
  }
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`
}

export function titleFromUrl(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

export function faviconUrl(pageUrl) {
  try {
    const u = new URL(pageUrl)
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`
  } catch { return null }
}
