/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        crop: {
          50: '#f3faf4',
          100: '#e3f2e6',
          200: '#c8e4ce',
          300: '#9ecfaa',
          400: '#6bb37c',
          500: '#45965c',
          600: '#357849',
          700: '#2c603c',
          800: '#264d32',
          900: '#20402a',
        },
        soil: {
          100: '#f5efe8',
          200: '#e8d9c8',
          500: '#a67c52',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 24px 72px rgba(79, 113, 101, 0.12)',
        soft: '0 8px 32px rgba(44, 96, 60, 0.08)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
