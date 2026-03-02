import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: '#F5F0EB' }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ width: 40, height: 40 }}
        >
          <svg viewBox="0 0 40 40" fill="none">
            <path d="M8 20 Q14 8, 20 20 Q26 32, 32 20" stroke="url(#grad)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C8BDDB"/>
                <stop offset="100%" stopColor="#7C6FCD"/>
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#C8BDDB', letterSpacing: '0.12em' }}
        >
          canvascape
        </motion.p>
      </motion.div>
    </div>
  )
}
