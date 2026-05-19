/** @type {import('tailwindcss').Config} */
const fontSize = {
  xs: ['12px', { lineHeight: '16px', letterSpacing: '0' }],
  sm: ['13px', { lineHeight: '18px', letterSpacing: '0' }],
  base: ['14px', { lineHeight: '20px', letterSpacing: '0' }],
  lg: ['16px', { lineHeight: '24px', letterSpacing: '0' }],
  xl: ['18px', { lineHeight: '28px', letterSpacing: '0' }],
  '2xl': ['22px', { lineHeight: '30px', letterSpacing: '0' }],
  '3xl': ['28px', { lineHeight: '36px', letterSpacing: '0' }],
  '4xl': ['36px', { lineHeight: '44px', letterSpacing: '0' }],
  '5xl': ['48px', { lineHeight: '56px', letterSpacing: '0' }],
  '6xl': ['60px', { lineHeight: '68px', letterSpacing: '0' }],
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontSize,
    extend: {
      colors: {
        primary: { DEFAULT: '#2969CD', dark: '#1E4FA0', light: '#E8EFFB', tint: '#F4F8FE' },
        accent:  { DEFAULT: '#0F6E56', dark: '#0A5642', light: '#E0F2EC' },
        warning: { DEFAULT: '#BA7517', light: '#FEF7E6' },
        urgent:  { DEFAULT: '#A32D2D', light: '#FCEEEE' },
        ink:     { DEFAULT: '#09121F', 2: '#1F2C3D', 3: '#3A4A60', 4: '#5E6F84' },
        line:    { DEFAULT: '#D7DDE5', 2: '#EAEEF3' },
        bg:      '#F7F9FB',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
