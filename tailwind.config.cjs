/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#0B0907',  // warm desert night
          800: '#141009',  // cards
          700: '#1E1911',  // inputs, inner surfaces
          600: '#2B2215',  // borders, dividers
        },
        accent: {
          DEFAULT: '#C8902A',  // Joshua Tree amber
          light:   '#D4A44A',  // warm gold
          muted:   '#6B8A6E',  // desert sage
        },
        success: '#7A9E7E',  // sage green
        warn:    '#D4952A',  // warm amber-yellow
        danger:  '#C04A3A',  // terracotta red
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
          '40%':      { boxShadow: '0 0 24px 4px rgba(122, 158, 126, 0.22)' },
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
