import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0E0D0A', position: 'relative', overflow: 'hidden' }}>
      {/* Warm glow */}
      <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 300, background: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)', pointerEvents: 'none' }}/>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>

        {/* Logo mark */}
        <div style={{ position: 'relative', width: 56, height: 56 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', inset: 0 }}>
            <svg viewBox="0 0 56 56" fill="none" width="56" height="56">
              <circle cx="28" cy="28" r="25" stroke="rgba(245,158,11,0.1)" strokeWidth="1.5"/>
              <circle cx="28" cy="28" r="25" stroke="url(#lg)" strokeWidth="1.5" strokeDasharray="48 110" strokeLinecap="round"/>
              <defs>
                <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F59E0B"/>
                  <stop offset="100%" stopColor="transparent"/>
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
              <rect x="2" y="2" width="8" height="8" rx="2" stroke="#F59E0B" strokeWidth="1.8"/>
              <rect x="14" y="2" width="8" height="8" rx="2" stroke="#F59E0B" strokeWidth="1.8" opacity="0.45"/>
              <rect x="2" y="14" width="8" height="8" rx="2" stroke="#F59E0B" strokeWidth="1.8" opacity="0.45"/>
              <rect x="14" y="14" width="8" height="8" rx="2" stroke="#F59E0B" strokeWidth="1.8" opacity="0.2"/>
            </svg>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, color: '#F5F0E8', letterSpacing: '-0.04em' }}>
            Canvas<span style={{ color: '#F59E0B' }}>scape</span>
          </span>
          <span style={{ fontSize: 12.5, color: '#6A6454', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.02em' }}>
            Loading your workspace…
          </span>
        </motion.div>

        <motion.div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map(i => (
            <motion.span key={i}
              animate={{ opacity: [0.15, 1, 0.15], scale: [0.7, 1, 0.7] }}
              transition={{ duration: 1.3, delay: i * 0.22, repeat: Infinity }}
              style={{ width: 4, height: 4, borderRadius: '50%', background: '#F59E0B', display: 'block' }}/>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
