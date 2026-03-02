import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function flattenMarkdownText(children) {
  return Array.isArray(children) ? children.join('') : String(children ?? '')
}

function normalizeHref(rawHref) {
  if (!rawHref) return ''
  let href = String(rawHref).trim()

  // Common model typo: duplicate protocol token.
  href = href.replace(/^httpshttps:\/\//i, 'https://').replace(/^httphttp:\/\//i, 'http://')
  if (/^https?:\/\/https?:\/\//i.test(href)) {
    href = href.replace(/^https?:\/\/https?:\/\//i, m =>
      m.toLowerCase().includes('https://https://') ? 'https://' : 'http://'
    )
  }
  if (/^www\./i.test(href)) href = `https://${href}`

  if (/^(https?:\/\/|mailto:|tel:)/i.test(href)) return href
  if (/^(#|\/|\.{1,2}\/)/.test(href)) return href
  return ''
}

function CodeBlock({ code, language, compact }) {
  const [copied, setCopied] = useState(false)

  const onCopy = () => {
    navigator.clipboard.writeText(code).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      },
      () => {}
    )
  }

  return (
    <div style={{
      margin: compact ? '4px 0' : '6px 0',
      border: '1px solid rgba(245,158,11,0.18)',
      borderRadius: 10,
      overflow: 'hidden',
      background: 'rgba(0,0,0,0.34)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: compact ? '5px 9px' : '6px 10px',
        borderBottom: '1px solid rgba(245,158,11,0.14)',
        background: 'rgba(245,158,11,0.08)',
      }}>
        <span style={{
          fontSize: 10,
          color: 'var(--t3)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontFamily: "'DM Mono', monospace",
        }}>
          {language || 'Code'}
        </span>
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={onCopy}
          style={{
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 6,
            padding: '2px 8px',
            background: copied ? 'rgba(52,211,153,0.16)' : 'rgba(255,255,255,0.03)',
            color: copied ? '#34D399' : 'var(--t2)',
            fontSize: 10.5,
            lineHeight: 1.4,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 120ms ease',
          }}
          title={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{
        margin: 0,
        padding: compact ? '9px 10px' : '10px 11px',
        overflowX: 'auto',
        fontSize: compact ? 11.25 : 11.5,
        lineHeight: 1.65,
        color: '#F2E6CB',
        fontFamily: "'DM Mono', monospace",
        whiteSpace: 'pre',
        userSelect: 'text',
      }}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function MarkdownMessage({ content, compact = false }) {
  const source = useMemo(() => String(content || ''), [content])

  const components = useMemo(() => ({
    p: ({ children }) => (
      <p style={{
        margin: compact ? '2px 0' : '3px 0',
        fontSize: compact ? 12.35 : 12.85,
        lineHeight: 1.75,
        color: 'var(--t1)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {children}
      </p>
    ),
    h1: ({ children }) => (
      <h1 style={{
        margin: '8px 0 5px',
        fontSize: compact ? 15.25 : 16.25,
        lineHeight: 1.3,
        letterSpacing: '-0.02em',
        color: 'var(--t1)',
        fontWeight: 760,
        fontFamily: "'Syne', sans-serif",
      }}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 style={{
        margin: '7px 0 4px',
        fontSize: compact ? 14.2 : 15,
        lineHeight: 1.35,
        letterSpacing: '-0.015em',
        color: 'var(--t1)',
        fontWeight: 720,
      }}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 style={{
        margin: '6px 0 4px',
        fontSize: compact ? 13.15 : 13.6,
        lineHeight: 1.35,
        color: 'var(--t1)',
        fontWeight: 680,
      }}>
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 style={{
        margin: '5px 0 3px',
        fontSize: compact ? 12.75 : 13.1,
        lineHeight: 1.35,
        color: 'var(--t1)',
        fontWeight: 650,
      }}>
        {children}
      </h4>
    ),
    h5: ({ children }) => (
      <h5 style={{
        margin: '4px 0 2px',
        fontSize: compact ? 12.45 : 12.75,
        lineHeight: 1.35,
        color: 'var(--t1)',
        fontWeight: 630,
      }}>
        {children}
      </h5>
    ),
    h6: ({ children }) => (
      <h6 style={{
        margin: '4px 0 2px',
        fontSize: compact ? 12.25 : 12.6,
        lineHeight: 1.35,
        color: 'var(--t2)',
        fontWeight: 620,
      }}>
        {children}
      </h6>
    ),
    ul: ({ children }) => (
      <ul style={{
        margin: compact ? '3px 0 4px' : '4px 0 5px',
        paddingLeft: compact ? 18 : 20,
        display: 'grid',
        gap: compact ? 3 : 4,
        color: 'var(--t1)',
      }}>
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol style={{
        margin: compact ? '3px 0 4px' : '4px 0 5px',
        paddingLeft: compact ? 19 : 21,
        display: 'grid',
        gap: compact ? 3 : 4,
        color: 'var(--t1)',
      }}>
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li style={{
        fontSize: compact ? 12.35 : 12.85,
        lineHeight: 1.65,
        color: 'var(--t1)',
        wordBreak: 'break-word',
      }}>
        {children}
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote style={{
        margin: compact ? '4px 0' : '5px 0',
        padding: compact ? '5px 0 5px 10px' : '6px 0 6px 11px',
        borderLeft: '3px solid var(--a)',
        color: 'var(--t2)',
        background: 'rgba(245,158,11,0.06)',
        borderRadius: '0 8px 8px 0',
      }}>
        {children}
      </blockquote>
    ),
    hr: () => (
      <hr style={{
        border: 0,
        borderTop: '1px solid rgba(245,158,11,0.2)',
        margin: compact ? '7px 0' : '8px 0',
      }}/>
    ),
    strong: ({ children }) => (
      <strong style={{ fontWeight: 700, color: 'var(--t1)' }}>{children}</strong>
    ),
    em: ({ children }) => (
      <em style={{ fontStyle: 'italic', color: 'var(--t1)' }}>{children}</em>
    ),
    del: ({ children }) => (
      <del style={{ color: 'var(--t3)' }}>{children}</del>
    ),
    code: ({ inline, className, children }) => {
      const text = flattenMarkdownText(children).replace(/\n$/, '')
      if (inline) {
        return (
          <code style={{
            padding: '1px 6px',
            borderRadius: 5,
            border: '1px solid rgba(245,158,11,0.2)',
            background: 'rgba(245,158,11,0.13)',
            color: 'var(--a)',
            fontSize: '0.88em',
            fontFamily: "'DM Mono', monospace",
            whiteSpace: 'break-spaces',
          }}>
            {text}
          </code>
        )
      }
      const match = /language-([\w-]+)/i.exec(className || '')
      return <CodeBlock code={text} language={match?.[1]} compact={compact}/>
    },
    a: ({ href, children }) => {
      const normalized = normalizeHref(href)
      if (!normalized) {
        return (
          <span style={{
            color: 'var(--t3)',
            textDecoration: 'line-through',
            textDecorationColor: 'rgba(248,113,113,0.7)',
            textUnderlineOffset: 2,
          }}>
            {children}
          </span>
        )
      }
      return (
        <a
          href={normalized}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            color: 'var(--a)',
            textDecoration: 'underline',
            textDecorationThickness: 1,
            textUnderlineOffset: 2,
            wordBreak: 'break-all',
          }}
        >
          {children}
        </a>
      )
    },
    table: ({ children }) => (
      <div style={{
        margin: compact ? '6px 0' : '7px 0',
        overflowX: 'auto',
        border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: 10,
      }}>
        <table style={{
          width: 'max-content',
          minWidth: '100%',
          borderCollapse: 'collapse',
          fontSize: compact ? 11.8 : 12.3,
          lineHeight: 1.5,
        }}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead style={{ background: 'rgba(245,158,11,0.12)' }}>{children}</thead>
    ),
    tbody: ({ children }) => (
      <tbody style={{ background: 'rgba(0,0,0,0.05)' }}>{children}</tbody>
    ),
    tr: ({ children }) => (
      <tr style={{ borderBottom: '1px solid rgba(245,158,11,0.15)' }}>{children}</tr>
    ),
    th: ({ children }) => (
      <th style={{
        padding: compact ? '7px 9px' : '8px 10px',
        borderRight: '1px solid rgba(245,158,11,0.12)',
        textAlign: 'left',
        fontWeight: 700,
        color: 'var(--t1)',
        whiteSpace: 'nowrap',
      }}>
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td style={{
        padding: compact ? '7px 9px' : '8px 10px',
        borderRight: '1px solid rgba(245,158,11,0.1)',
        color: 'var(--t1)',
        verticalAlign: 'top',
        wordBreak: 'break-word',
      }}>
        {children}
      </td>
    ),
  }), [compact])

  return (
    <div style={{ display: 'grid', gap: compact ? 4 : 5, userSelect: 'text' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  )
}
