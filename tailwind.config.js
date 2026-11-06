/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chill: {
          50: '#f0faf5',
          100: '#e2f8ef',
          200: '#c5eedf',
          300: '#94ddc5',
          400: '#58b99a',
          500: '#2da083',
          600: '#1e7f67',
          700: '#166452',
          800: '#144f42',
          900: '#124137',
          950: '#072520',
        },
        ink: {
          DEFAULT: '#142d2b',
          light: '#21382c',
          muted: '#718985',
        },
        mint: {
          DEFAULT: '#e7fbf4',
          subtle: '#f2f7f6',
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
