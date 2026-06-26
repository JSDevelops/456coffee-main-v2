/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--app-font)',
          'Prompt',
          'Noto Sans Thai',
          'Inter',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
      colors: {
        branch: {
          pending: '#F59E0B',
          preparing: '#3B82F6',
          ready: '#10B981',
          picked: '#6366F1',
        }
      }
    },
  },
  plugins: [],
}
