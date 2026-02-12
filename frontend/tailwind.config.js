/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
      colors: {
        brand: {
          orange: '#FF8F33',
          'orange-light': '#FFB366',
          'orange-dark': '#E67100',
          navy: '#001046',
          'navy-light': '#19285F',
          'navy-dark': '#000832',
          gray: '#F2F2F2',
          'gray-dark': '#E0E0E0',
        },
        primary: {
          50: '#FFF5EB',
          100: '#FFEAD6',
          200: '#FFD4AD',
          300: '#FFBF85',
          400: '#FFA75C',
          500: '#FF8F33',
          600: '#E67100',
          700: '#B35700',
          800: '#803E00',
          900: '#4D2500',
          950: '#331800',
        },
        secondary: {
          50: '#E6E8F2',
          100: '#CCD1E5',
          200: '#99A3CB',
          300: '#6675B1',
          400: '#334797',
          500: '#001046',
          600: '#000D3B',
          700: '#000A2F',
          800: '#000623',
          900: '#000418',
          950: '#00020F',
        },
      },
      fontFamily: {
        sans: ['Gilroy', 'Inter', 'system-ui', 'sans-serif'],
        gilroy: ['Gilroy', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
