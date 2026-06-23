/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['class', '[data-dark]'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0d4c92', dark: '#0a3d78' },
        secondary: { DEFAULT: '#09afd9' },
      },
      fontFamily: {
        sans: ['Barlow', 'sans-serif'],
        title: ['Titillium Web', 'sans-serif'],
      },
      borderRadius: { app: '10px' },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}
