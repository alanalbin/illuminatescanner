/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        dark: {
          950: '#07050d',
          900: '#0c0817',
          850: '#110b22',
          800: '#170f2e',
          700: '#231845',
          600: '#342661',
        }
      },
      boxShadow: {
        'glow-purple': '0 0 25px -3px rgba(168, 85, 247, 0.35)',
        'glow-purple-lg': '0 0 45px -5px rgba(168, 85, 247, 0.45)',
        'glow-green': '0 0 30px -3px rgba(34, 197, 94, 0.45)',
        'glow-red': '0 0 30px -3px rgba(239, 68, 68, 0.45)',
        'glow-amber': '0 0 30px -3px rgba(245, 158, 11, 0.45)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2.5s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(100%)' },
        }
      }
    },
  },
  plugins: [],
}
