import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand primary — recovered from pulseDotPrimary rgba(41,105,205)
        primary: {
          DEFAULT: "#2969CD",
          light: "#E4ECF9",
          dark: "#1F539F",
          tint: "#EEF4FC",
        },
        // Accent (success/green) — recovered from pulseDot rgba(15,110,86)
        accent: {
          DEFAULT: "#0F6E56",
          light: "#DCEDE7",
          dark: "#0A5642",
        },
        // Text scale
        ink: {
          DEFAULT: "#121826",
          2: "#2A3340",
          3: "#4B5563",
          4: "#5F6B7A",
        },
        bg: {
          DEFAULT: "#F4F6F8",
        },
        line: {
          DEFAULT: "#CBD2DA",
          2: "#E1E5EA",
        },
        // Status colors
        urgent: {
          DEFAULT: "#E5484D",
          light: "#FCEAEA",
          dark: "#B3262B",
        },
        warning: {
          DEFAULT: "#E0922A",
          light: "#FBEFD9",
          dark: "#97601A",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ['"Plus Jakarta Sans"', "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.5rem",
        xl: "0.625rem",
        "2xl": "0.75rem",
        "3xl": "0.75rem",
      },
      boxShadow: {
        sm: "0 1px 2px rgb(18 24 38 / 0.05)",
        md: "0 2px 6px rgb(18 24 38 / 0.08)",
        lg: "0 4px 12px rgb(18 24 38 / 0.10)",
        xl: "0 6px 18px rgb(18 24 38 / 0.12)",
        "2xl": "0 8px 24px rgb(18 24 38 / 0.14)",
      },
      transitionDuration: {
        150: "150ms",
        200: "180ms",
        300: "180ms",
        500: "180ms",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
