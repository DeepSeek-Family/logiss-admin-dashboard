import tailwindcssAnimate from 'tailwindcss-animate';

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
          DEFAULT: '#1B2433',
          2: '#39424F',
          3: '#5B6573',
          4: '#9AA4B2',
        },
        // Surfaces & borders — bg/line recovered from scrollbar styles
        bg: {
          DEFAULT: '#F7F9FB',
        },
        line: {
          DEFAULT: '#D7DDE5',
          2: '#E8ECF1',
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
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
