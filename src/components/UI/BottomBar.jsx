// BottomBar — lives OUTSIDE ReactFlowProvider.
// Do NOT call useReactFlow() here. Fit-view is triggered via custom event.
import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { normalizeUrl, titleFromUrl, faviconUrl } from '../../utils/urlUtils'

const QUICK = [
  { label:'Google',  url:'https://google.com',        icon:'🔍' },
  { label:'GitHub',  url:'https://github.com',        icon:'🐙' },
  { label:'YouTube', url:'https://youtube.com',       icon:'▶️' },
  { label:'ChatGPT', url:'https://chat.openai.com',   icon:'✨' },
  { label:'Notion',  url:'https://notion.so',         icon:'📝' },
  { label:'Figma',   url:'https://figma.com',         icon:'🎨' },
  { label:'Gmail',   url:'https://mail.google.com',   icon:'📧' },
  { label:'Linear',  url:'https://linear.app',        icon:'🎯' },
]

export default function BottomBar() {
  const { isComposerOpen, setComposerOpen, isSidebarOpen, toggleSidebar,
          addWebNode, categories } = useWorkspaceStore()

  const [input, setInput]       = useState('')
  const [selCat, setSelCat]     = useState(null)
  const inputRef                = useRef(null)

  useEffect(() => {
    if (isComposerOpen) { setInput(''); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [isComposerOpen])

  const open = useCallback((rawUrl) => {
    const url = normalizeUrl(rawUrl || input)
    addWebNode({ url, title: titleFromUrl(url), favicon: faviconUrl(url),
                 categoryId: selCat,
                 position: { x: 180 + Math.random()*260, y: 100 + Math.random()*160 } })
    setComposerOpen(false); setInput(''); setSelCat(null)
  }, [input, selCat, addWebNode, setComposerOpen])

  return (
    <>
      {/* Always-visible bar */}
      <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:10, padding:'0 14px',
                    height:52, background:'rgba(250,248,255,0.97)',
                    borderTop:'1px solid rgba(200,189,219,0.25)' }}>

        {/* Sidebar toggle */}
        <Btn active={isSidebarOpen} title="Toggle sidebar (Ctrl+\)" onClick={toggleSidebar}>
          <rect x="2" y="2" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M6 2v12" stroke="currentColor" strokeWidth="1.5"/>
        </Btn>

        {/* Open-URL trigger */}
        <button onClick={() => setComposerOpen(true)}
          style={{ flex:1, display:'flex', alignItems:'center', gap:10, padding:'0 14px',
                   height:34, borderRadius:10, textAlign:'left', cursor:'pointer',
                   background:'rgba(255,255,255,0.8)', border:'1px solid rgba(200,189,219,0.45)',
                   color:'#B8ADCC', fontSize:13, fontFamily:'inherit',
                   boxShadow:'0 1px 6px rgba(120,100,180,0.06)', transition:'border-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor='rgba(124,111,205,0.4)'}
          onMouseLeave={e => e.currentTarget.style.borderColor='rgba(200,189,219,0.45)'}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Open a website or search…
          <kbd style={{ marginLeft:'auto', padding:'2px 7px', borderRadius:6, fontFamily:'monospace', fontSize:11, background:'rgba(200,189,219,0.18)', color:'#C8BDDB' }}>Ctrl+N</kbd>
        </button>

        {/* Fit view */}
        <Btn title="Fit all cards" onClick={() => window.dispatchEvent(new CustomEvent('canvas:fitview'))}>
          <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </Btn>
      </div>

      {/* Composer modal */}
      <AnimatePresence>
        {isComposerOpen && (
          <>
            <motion.div key="bd" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(61,53,82,0.2)', backdropFilter:'blur(4px)' }}
              onClick={() => setComposerOpen(false)}/>

            <motion.div key="box"
              initial={{opacity:0, y:20, scale:0.97}} animate={{opacity:1, y:0, scale:1}} exit={{opacity:0, y:14, scale:0.97}}
              transition={{duration:0.18, ease:[0.16,1,0.3,1]}}
              style={{ position:'fixed', zIndex:301, bottom:64, left:'50%', transform:'translateX(-50%)',
                       width:520, background:'rgba(255,255,255,0.98)', borderRadius:18,
                       border:'1.5px solid rgba(200,189,219,0.5)',
                       boxShadow:'0 -6px 36px rgba(80,60,140,0.13), 0 4px 16px rgba(80,60,140,0.08)',
                       fontFamily:'inherit', overflow:'hidden' }}
              onClick={e => e.stopPropagation()}>

              {/* Input */}
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 18px' }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{flexShrink:0,color:'#C8BDDB'}}>
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter') open(); if(e.key==='Escape') setComposerOpen(false); e.stopPropagation() }}
                  placeholder="Enter URL or search…"
                  style={{ flex:1, outline:'none', border:'none', background:'transparent', fontSize:14, color:'#3D3552', fontFamily:'inherit' }}/>
                {input && <button onClick={()=>setInput('')} style={{color:'#C8BDDB',fontSize:18,border:'none',background:'none',cursor:'pointer',lineHeight:1}}>×</button>}
              </div>

              {/* Category picker */}
              {categories.length > 0 && (
                <div style={{ padding:'0 18px 12px', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{fontSize:12,color:'#C8BDDB'}}>Add to:</span>
                  {[{id:null,label:'None',color:'#9B91B8',bg:'rgba(124,111,205,0.06)'},...categories].map(cat => (
                    <button key={cat.id??'none'} onClick={()=>setSelCat(selCat===cat.id ? null : cat.id)}
                      style={{ padding:'3px 10px', borderRadius:20, fontSize:12, border: selCat===cat.id ? `1px solid ${cat.color}88` : '1px solid transparent',
                               background: selCat===cat.id ? cat.bg??'rgba(124,111,205,0.12)' : 'rgba(124,111,205,0.05)',
                               color: selCat===cat.id ? cat.color : '#9B91B8', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
                      {cat.id && <span style={{width:6,height:6,borderRadius:'50%',background:cat.color,display:'inline-block'}}/>}
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}

              <div style={{height:1, background:'rgba(200,189,219,0.25)', margin:'0 18px'}}/>

              {/* Quick sites */}
              <div style={{ padding:'10px 14px 14px' }}>
                <p style={{ fontSize:10, color:'#C8BDDB', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, paddingLeft:4 }}>Quick open</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {QUICK.map(s => (
                    <button key={s.url} onClick={() => open(s.url)}
                      style={{ padding:'5px 12px', borderRadius:20, fontSize:12, border:'1px solid rgba(124,111,205,0.15)', background:'rgba(124,111,205,0.07)', color:'#6B5FA0', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, transition:'background 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(124,111,205,0.14)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(124,111,205,0.07)'}>
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hints */}
              <div style={{ padding:'8px 18px', borderTop:'1px solid rgba(200,189,219,0.18)', display:'flex', gap:16 }}>
                {[['↵','Open'],['Esc','Dismiss']].map(([k,l]) => (
                  <span key={k} style={{ fontSize:11, color:'#C8BDDB', display:'flex', alignItems:'center', gap:5 }}>
                    <kbd style={{ padding:'1px 6px', borderRadius:5, fontFamily:'monospace', fontSize:10, background:'rgba(200,189,219,0.2)' }}>{k}</kbd>{l}
                  </span>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function Btn({ onClick, title, active, children }) {
  return (
    <button onClick={onClick} title={title}
      style={{ width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:10, border:'none', cursor:'pointer', flexShrink:0, transition:'all 0.15s', fontFamily:'inherit',
               background: active ? 'rgba(124,111,205,0.12)' : 'transparent',
               color:      active ? '#7C6FCD' : '#C8BDDB' }}
      onMouseEnter={e=>{ e.currentTarget.style.background='rgba(124,111,205,0.12)'; e.currentTarget.style.color='#7C6FCD' }}
      onMouseLeave={e=>{ e.currentTarget.style.background=active?'rgba(124,111,205,0.12)':'transparent'; e.currentTarget.style.color=active?'#7C6FCD':'#C8BDDB' }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">{children}</svg>
    </button>
  )
}
