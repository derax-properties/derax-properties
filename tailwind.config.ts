import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0c0b09",
          soft: "#17140f",
          charcoal: "#221f1a",
        },
        cream: {
          DEFAULT: "#f7f3ea",
          soft: "#fbf9f4",
        },
        gold: {
          DEFAULT: "#c9a24b",
          light: "#e0c584",
          dark: "#a9812f",
        },
        forest: {
          DEFAULT: "#173a2e",
          light: "#22503f",
          dark: "#0f2921",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        hand: ["var(--font-caveat)", "cursive"],
      },
      maxWidth: {
        content: "1280px",
      },
      boxShadow: {
        card: "0 20px 45px -20px rgba(12, 11, 9, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
