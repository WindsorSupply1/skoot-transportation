/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        skoot: {
          orange: '#FF6600',
          green: '#28A745',
          gray: '#333333',
          lightGray: '#F5F5F5',
        },
        primary: {
          DEFAULT: '#FF6600',
          50: '#FFF4E6',
          100: '#FFE8CC',
          200: '#FFD199',
          300: '#FFBA66',
          400: '#FFA333',
          500: '#FF6600',
          600: '#E55A00',
          700: '#CC4F00',
          800: '#B34400',
          900: '#993A00',
        },
        secondary: {
          DEFAULT: '#28A745',
          50: '#F0F9F1',
          100: '#D4F4DA',
          200: '#A8E9B6',
          300: '#7CDE91',
          400: '#50D36C',
          500: '#28A745',
          600: '#228A3A',
          700: '#1C6D2F',
          800: '#165024',
          900: '#0F331A',
        },
        neutral: {
          DEFAULT: '#333333',
          50: '#F9F9F9',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#333333',
        }
      },
      fontFamily: {
        sans: ['Arial', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}