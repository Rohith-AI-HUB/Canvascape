/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: { bg: '#F5F0EB', grid: '#E8E0D8' },
        pastel: {
          rose: '#FFD6D6', lavender: '#E8D6FF', mint: '#D6FFE8',
          sky: '#D6EEFF', peach: '#FFE8D6', lemon: '#FFFBD6',
        },
        node: {
          border: '#E2D9F3', shadow: 'rgba(120, 100, 180, 0.12)',
          headerBg: '#F8F5FF', active: '#7C6FCD',
        },
        ui: {
          text: '#3D3552', muted: '#9B91B8',
          accent: '#7C6FCD', accentLight: '#EEE9FF',
        },
      },
      fontFamily: {
        display: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        node: '16px', card: '12px', pill: '999px',
      },
      boxShadow: {
        node: '0 4px 24px rgba(120, 100, 180, 0.10), 0 1px 4px rgba(120, 100, 180, 0.08)',
        nodeActive: '0 8px 40px rgba(120, 100, 180, 0.20), 0 2px 8px rgba(120, 100, 180, 0.12)',
        floating: '0 8px 32px rgba(80, 60, 140, 0.15), 0 2px 8px rgba(80, 60, 140, 0.08)',
      },
    },
  },
  plugins: [],
}
