/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink:        { DEFAULT: '#2b1530', soft: '#5a3f63', mute: '#9c84a8' },
        paper:      { DEFAULT: '#fff8ef', dim: '#fbeedd' },
        line:       '#f0d9c2',
        hairline:   '#f6e6d2',
        accent:     { DEFAULT: '#f5b301', deep: '#b9530a', soft: '#fff3d3' },
        cream:      '#ffe9bd',
        gold:       { 1: '#ffd166', 2: '#f5b301', 3: '#c98315' },
        espresso:   { DEFAULT: '#2b1530', light: '#4d2546' },
        sage:       { DEFAULT: '#10b981', soft: '#d4fbf3' },
        mint:       { DEFAULT: '#14b8a6', soft: '#d4fbf3' },
        berry:      { DEFAULT: '#f43f7a', soft: '#ffe1ec' },
        rose:       { DEFAULT: '#f43f7a', soft: '#ffe1ec' },
        lavender:   { DEFAULT: '#8b5cf6', soft: '#ece4ff' },
        sky:        { DEFAULT: '#38bdf8', soft: '#def4ff' },
        success:    { DEFAULT: '#10b981', soft: '#d4fbf3' },
        danger:     { DEFAULT: '#f43f5e', soft: '#ffe1ec' },
        info:       { DEFAULT: '#6366f1', soft: '#ece4ff' },
        // Legacy aliases used by AuthModal
        primary: {
          50:  '#fffaf2', 100: '#fff3d3', 200: '#ffe9bd', 300: '#ffd166',
          400: '#f5b301', 500: '#c98315', 600: '#b9530a', 700: '#7a3608',
          800: '#4d2546', 900: '#2b1530',
        },
      },
      fontFamily: {
        display: ['Niramit', 'Inter', 'system-ui', 'sans-serif'],
        body:    ['Niramit', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        soft:  '0 1px 2px rgba(43, 21, 48, 0.06)',
        pop:   '0 10px 28px -10px rgba(43, 21, 48, 0.16)',
        deep:  '0 28px 56px -16px rgba(43, 21, 48, 0.22)',
        amber: '0 22px 46px -22px rgba(245, 179, 1, 0.55)',
        rose:  '0 22px 46px -22px rgba(244, 63, 122, 0.45)',
        glow:  '0 0 0 4px rgba(245, 179, 1, 0.20)',
      },
      animation: {
        'fade-in':  'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        scaleIn: { '0%': { transform: 'scale(0.94)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      },
    },
  },
  plugins: [],
};
