import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: {
          950: "#08071a",
          900: "#0d0b22",
          800: "#14122e",
          700: "#1c1939",
          600: "#27234d",
        },
        aurora: {
          violet: "#8b7cf6",
          pink: "#f6a6d8",
          blue: "#6ec6ff",
          gold: "#ffd9a0",
          mint: "#7cf6c0",
        },
      },
      fontFamily: {
        brand: ['"Cormorant Garamond"', '"Noto Serif SC"', "serif"],
        display: ['"Noto Serif SC"', "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(139,124,246,0.55)",
        "glow-pink": "0 0 40px -8px rgba(246,166,216,0.5)",
        glass: "0 8px 32px rgba(4,3,20,0.55), inset 0 1px 0 rgba(255,255,255,0.07)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.25" },
          "50%": { opacity: "0.9" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.92)", opacity: "0.7" },
          "70%": { transform: "scale(1.25)", opacity: "0" },
          "100%": { transform: "scale(1.25)", opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        twinkle: "twinkle 3s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2.6s cubic-bezier(0.2,0.6,0.4,1) infinite",
        float: "float 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
