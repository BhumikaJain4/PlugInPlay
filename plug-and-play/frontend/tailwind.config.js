/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        maroon: {
          DEFAULT: '#6a0f21',
          light: '#8c1f35',
          dark: '#4a0a18',
        },
        gold: {
          DEFAULT: '#b98b33',
          light: '#d4a84b',
        },
        cream: {
          DEFAULT: '#fbf5ea',
          dark: '#f5ecd8',
        },
        charcoal: {
          DEFAULT: '#1a1416',
          light: '#2a2024',
        },
        taupe: {
          DEFAULT: '#cfc5b8',
          light: '#e5ded4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease',
        'fade-in': 'fadeIn 0.2s ease',
      },
      keyframes: {
        slideIn: {
          from: { opacity: 0, transform: 'translateY(-12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
