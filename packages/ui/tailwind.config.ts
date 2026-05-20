import type { Config } from "tailwindcss";
import sharedConfig from "@repo/config/tailwind";

const config: Config = {
  content: ["./src/**/*.tsx"],
  presets: [sharedConfig],
};

export default config;
