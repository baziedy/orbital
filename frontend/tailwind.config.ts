import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: "#F7F7F5",
          secondary: "#FFFFFF",
          dark: "#0A0B0E",
          darkCard: "#12141A",
        },
        text: {
          primary: "#111111",
          secondary: "#737373",
          dark: "#FFFFFF",
          darkMuted: "#9CA3AF",
        },
        border: {
          light: "#E7E7E4",
          dark: "#26282E",
        },
        accent: {
          DEFAULT: "#111111",
          subtle: "#F7F7F5",
          darkSubtle: "#1C1E24",
          infrared: "#737373",
          cyan: "#111111",
          status: "#737373",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "sans-serif"],
        serif: ["var(--font-serif)", "DM Serif Display", "Georgia", "serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "SF Mono", "monospace"],
      },
      letterSpacing: {
        widestPlus: "0.2em",
        mega: "0.28em",
      },
    },
  },
  plugins: [],
};

export default config;
