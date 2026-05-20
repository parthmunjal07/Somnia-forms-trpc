import type { Config } from "tailwindcss";

const config: Omit<Config, "content"> = {
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['JetBrains Mono', 'IBM Plex Mono', 'sans-serif'],
        display: ['Cormorant Garamond', 'serif'],
      },
      colors: {
        limbo: "var(--color-limbo)",
        totem: "var(--color-totem)",
        fog: "var(--color-fog)",
      }
    },
  },
  plugins: [],
};

export default config;
