/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        ink: {
          DEFAULT: '#10172A',
          light: '#1B2440',
          50: '#EDEFF5',
        },
        parchment: {
          DEFAULT: '#F7F3E9',
          dark: '#EDE6D6',
        },
        seal: {
          DEFAULT: '#B3492B',
          dark: '#8F3A22',
          light: '#D9694A',
        },
        gold: {
          DEFAULT: '#C9A227',
          light: '#E0C158',
        },
        graphite: '#3A3F4B',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        signature: ['Caveat', 'cursive'],
      },
    },
  },
  plugins: [],
};