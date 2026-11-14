import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#050506",
        surface: "#0b0b0e",
        raised: "#121216",
        ink: "#f5f5f7",
        faint: "#71717a",
        panel: "#0c0c10",
        muted: "#a1a1aa",
        brand: {
          DEFAULT: "#ff7a1a",
          hover: "#ff9147",
          deep: "#e2620f",
          soft: "rgba(255,122,26,0.12)",
        },
        fox: {
          DEFAULT: "#ff7a1a",
          soft: "#ffa25c",
          deep: "#e85d04",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Arial", "Helvetica", "sans-serif"],
        display: ["var(--font-outfit)", "var(--font-inter)", "sans-serif"],
        rank: ["var(--font-bebas)", "var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        glass: "0 18px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
        brand: "0 0 60px rgba(255,122,26,0.28)",
      },
      backgroundImage: {
        "brand-fade": "linear-gradient(135deg, rgba(255,122,26,0.22), rgba(255,122,26,0))",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
