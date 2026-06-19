import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // SPIRA brand tokens
        spira: {
          900: "#0f5c5b",
          800: "#136868",
          700: "#228c8a",
          600: "#2da19e",
          500: "#5baeaa",
          300: "#97d2cb",
        },
        surface: {
          0: "#ffffff",
          50: "#f7faf9",
          100: "#edf5f4",
          200: "#dbe8e7",
        },
        text: {
          900: "#0f172a",
          700: "#334155",
          500: "#64748b",
        },
        border: "#d8e2e1",
        success: "#15803d",
        warning: "#b45309",
        danger: "#b91c1c",
        info: "#0f766e",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "20px",
        xl: "28px",
      },
      boxShadow: {
        sm: "0 1px 2px rgb(15 23 42 / 0.06)",
        md: "0 8px 24px rgb(15 23 42 / 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
