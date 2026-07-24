import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // HACCP-Builder brand palette — teal (food safety / clinical trust)
        // with a slate wordmark.
        brand: {
          50: "#effcf9",
          100: "#c9f6ec",
          500: "#0f9d8c",
          600: "#0b7d70",
          700: "#0a6459",
          900: "#0a3d37",
        },
        haccpslate: "#182432",
      },
    },
  },
  plugins: [],
};

export default config;
