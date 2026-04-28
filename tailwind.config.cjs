/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#07100A',  // deep forest night
          800: '#0D1A11',  // card surface — dark moss
          700: '#142119',  // inputs — forest shadow
          600: '#1C2E22',  // borders — forest edge
        },
        accent: {
          DEFAULT: '#4CAF7D',  // Rivian forest green
          light:   '#6DC99A',  // lighter canopy
          muted:   '#2E7A52',  // deep understory
        },
        success: '#5DBF82',  // bright leaf
        warn:    '#C8852A',  // amber harvest
        danger:  '#B84A3A',  // terracotta clay
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'check-pop':   'check-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.4) forwards',
        'block-glow':  'block-glow 1.2s ease-in-out',
        'fade-up':     'fade-up 0.25s ease-out',
        'streak-fire': 'streak-fire 1.5s ease-in-out infinite',
      },
      keyframes: {
        'check-pop': {
          '0%':   { transform: 'scale(0.3)', opacity: '0' },
          '60%':  { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        'block-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 transparent' },
          '40%':      { boxShadow: '0 0 24px 4px rgba(77, 175, 125, 0.2)' },
        },
        'fade-up': {
          'from': { opacity: '0', transform: 'translateY(6px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
        'streak-fire': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':      { transform: 'scale(1.15)' },
        },
      },
    },
  },
  plugins: [],
}
