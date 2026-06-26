/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          primary: '#6366F1',
          dark: '#0f172a',
          card: '#1e293b',
        }
      }
    },
  },
  plugins: [],
}
