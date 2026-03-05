/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4ff',
          100: '#dbeafe',
          500: '#1a56db',
          700: '#162847',
          900: '#0f1f3d',
        }
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
      }
    },
  },
  plugins: [],
}