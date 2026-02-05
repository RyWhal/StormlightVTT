/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Stormlight-inspired color palette
        storm: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#b9dfff',
          300: '#7cc5ff',
          400: '#36a8ff',
          500: '#0c8af0',
          600: '#006dcd',
          700: '#0057a6',
          800: '#004a89',
          900: '#003d71',
          950: '#00274a',
        },
        stormlight: {
          glow: '#7cc5ff',
          bright: '#ffffff',
        }
      },
      animation: {
        'roll-appear': 'roll-appear 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s infinite',
      },
      keyframes: {
        'roll-appear': {
          '0%': {
            transform: 'scale(0.8)',
            opacity: '0',
            boxShadow: '0 0 20px rgba(124, 197, 255, 0.8)',
          },
          '50%': {
            transform: 'scale(1.05)',
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1',
            boxShadow: 'none',
          },
        },
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 5px rgba(124, 197, 255, 0.5)',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(124, 197, 255, 0.8)',
          },
        },
      },
    },
  },
  plugins: [],
}
