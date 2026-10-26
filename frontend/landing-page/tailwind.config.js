/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#FBF9F5',
          100: '#F5EBE0',
          200: '#E6CCB2',
          300: '#DDB892',
          400: '#B08968',
          500: '#7F5539',
          600: '#9C6644',
          700: '#582F0E',
          800: '#3D200A',
          900: '#231205',
          950: '#140A03',
        },
        amber: {
          456: '#EA580C',
          gold: '#D97706',
          warm: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Prompt', 'Sarabun', 'sans-serif'],
        heading: ['Prompt', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
