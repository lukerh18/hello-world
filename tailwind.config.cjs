/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Rivian-esque neutral foundation: deep, matte, and calm.
        surface: {
          950: '#070707', // app chrome / deepest background
          900: '#0B0907', // page background
          800: '#141009', // cards
          700: '#1E1911', // inputs, inner surfaces
          600: '#2B2215', // borders, dividers
        },
        // Keep accent warm and restrained. Sage is secondary, not competing.
        accent: {
          DEFAULT: '#C8902A', // signature amber
          light: '#D4A44A', // focus / hover amber
          muted: '#6B8A6E', // sage success/support
          soft: '#A7824A', // low-emphasis amber
        },
        text: {
          primary: '#F1EBDF',
          secondary: '#CEC4B2',
          muted: '#9D9180',
        },
        border: {
          subtle: '#312618',
          strong: '#473824',
        },
        success: '#7A9E7E',
        warn: '#D4952A',
        danger: '#C04A3A',
      },
      fontFamily: {
        sans: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        panel:       '0 10px 30px rgba(0, 0, 0, 0.35)',
        insetSoft:   'inset 0 1px 0 rgba(241, 235, 223, 0.06)',
        'card-inset':'inset 0 1px 0 rgba(241, 235, 223, 0.06)',
        focusAmber:  '0 0 0 3px rgba(200, 144, 42, 0.35)',
        md:          '0 4px 12px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.25)',
        lg:          '0 24px 60px rgba(0,0,0,0.55), 0 6px 16px rgba(0,0,0,0.35)',
      },
      borderRadius: {
        panel: '18px',
        btn:   '12px',
        card:  '18px',
        pill:  '999px',
      },
      animation: {
        'check-pop': 'check-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.4) forwards',
        'block-glow': 'block-glow 1.2s ease-in-out',
        'fade-up': 'fade-up 0.25s ease-out',
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
