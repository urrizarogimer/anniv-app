/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blush: { 50: '#fff5f7', 100: '#ffe8ee', 200: '#ffd1dd', 300: '#fdb0c4', 400: '#f78aa8', 500: '#ec6a90', 600: '#d64d77', 700: '#b03a60' },
        ivory: '#fffaf2',
        champagne: { 200: '#f6e7c8', 300: '#ecd4a0', 400: '#d9b56e', 500: '#c49a4d' },
        sage: { 200: '#dcebd2', 300: '#c3dcb3', 400: '#9cc488' },
        lavender: { 200: '#ece4fb', 300: '#d9cbf5' },
        dusty: { 300: '#b9cbe6', 400: '#93acd6', 600: '#5c6ea6', 800: '#3d3f73' },
      },
      fontFamily: {
        sans: ['Quicksand', 'ui-rounded', 'system-ui', 'sans-serif'],
        script: ['"Dancing Script"', 'cursive'],
      },
    },
  },
  plugins: [],
}
