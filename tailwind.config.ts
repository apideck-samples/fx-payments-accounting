import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Inter",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        ink: {
          950: "#0b0b10",
          900: "#101017",
          800: "#16161f",
          700: "#1d1d28",
          600: "#262633",
          500: "#3a3a4a",
        },
        accent: {
          // Driven by CSS variables so a prospect's brand color can be applied
          // at runtime (see ?color= in launchParams). Defaults set in globals.css.
          500: "rgb(var(--accent-500) / <alpha-value>)",
          600: "rgb(var(--accent-600) / <alpha-value>)",
        },
      },
      boxShadow: {
        window:
          "0 30px 80px -20px rgba(0,0,0,0.45), 0 10px 30px -10px rgba(0,0,0,0.35)",
        card: "0 20px 50px -20px rgba(20,20,40,0.25)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
