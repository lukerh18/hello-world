/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#080808',  // near-black background
          800: '#111111',  // cards
          700: '#1a1a1a',  // inputs, inner surfaces
          600: '#252525',  // borders, dividers
        },
        accent: {
          DEFAULT: '#f97316',
          light:   '#fb923c',
          muted:   '#7c3aed',
        },
        success: '#22c55e',
        warn:    '#eab308',
        danger:  '#ef4444',
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
          '40%':      { boxShadow: '0 0 28px 4px rgba(34, 197, 94, 0.25)' },
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
