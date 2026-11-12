import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050506",
        panel: "#0c0c10",
        muted: "#8f98a2",
        fox: {
          DEFAULT: "#ff7a1a",
          soft: "#ffa25c",
          deep: "#e85d04",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-bebas)", "Impact", "sans-serif"],
        rank: ["var(--font-alfa)", "Georgia", "serif"],
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
