import type { Config } from "tailwindcss";

const config: Omit<Config, "content"> = {
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        display: ['var(--font-cormorant)', 'Cormorant Garamond', 'serif'],
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
