import tailwindcssAnimate from 'tailwindcss-animate';

var require = createRequire(import.meta.url);
var module = { exports: {} };

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand primary — recovered from pulseDotPrimary rgba(41,105,205)
        primary: {
          DEFAULT: '#2969CD',
          light: '#E4ECF9',
          dark: '#1F539F',
          tint: '#EEF4FC',
        },
        // Accent (success/green) — recovered from pulseDot rgba(15,110,86)
        accent: {
          DEFAULT: '#0F6E56',
          light: '#DCEDE7',
          dark: '#0A5642',
        },
        // Text scale
        ink: {
          DEFAULT: '#121826',
          2: '#2A3340',
          3: '#4B5563',
          4: '#5F6B7A',
        },
        bg: {
          DEFAULT: '#EEF1F5',
        },
        line: {
          DEFAULT: '#C5CDD8',
          2: '#D9DFE7',
        },
        // Status colors
        urgent: {
          DEFAULT: '#E5484D',
          light: '#FCEAEA',
          dark: '#B3262B',
        },
        warning: {
          DEFAULT: '#E0922A',
          light: '#FBEFD9',
          dark: '#97601A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
