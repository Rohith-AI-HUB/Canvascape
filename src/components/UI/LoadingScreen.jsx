import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#0D0D0F',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 400, height: 300,
        background: 'radial-gradient(ellipse, rgba(123,97,255,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
      >
        {/* Animated logo */}
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 44, height: 44,
            background: 'radial-gradient(circle, rgba(123,97,255,0.15), transparent)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
            <circle cx="22" cy="22" r="19" stroke="rgba(123,97,255,0.2)" strokeWidth="1"/>
            <path d="M8 22 Q14 10, 22 22 Q30 34, 36 22" stroke="url(#lg)" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <defs>
              <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7B61FF"/>
                <stop offset="100%" stopColor="#A78BFA"/>
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 18, fontWeight: 600, color: '#F0EEFF',
            letterSpacing: '-0.02em',
          }}>Canvascape</span>
          <span style={{ fontSize: 12, color: '#3A3750', letterSpacing: '0.06em' }}>Loading workspace…</span>
        </motion.div>

        {/* Loading dots */}
        <motion.div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
          {[0, 1, 2].map(i => (
            <motion.span key={i}
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1, 0.8] }}
              transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
              style={{ width: 4, height: 4, borderRadius: '50%', background: '#7B61FF', display: 'block' }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
