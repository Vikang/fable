import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        accent: "var(--accent)",
        secondary: "var(--secondary)",
        tertiary: "var(--tertiary)",
        ink: "var(--text)",
        "ink-muted": "var(--text-muted)",
        border: "var(--border)",
        "gutter-line": "var(--gutter-line)",
      },
      borderRadius: {
        tile: "var(--radius-tile)",
        card: "var(--radius-card)",
        pill: "var(--radius-pill)",
        chip: "var(--radius-chip)",
        small: "var(--radius-small)",
      },
      boxShadow: {
        tile: "var(--shadow-tile)",
        canvas: "var(--shadow-canvas)",
        card: "var(--shadow-card)",
      },
      fontFamily: {
        sans: ["Lexend", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        ease: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
