import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        user: {
          bg: "var(--user-bg)",
          surface: "var(--user-surface)",
          primary: "var(--user-primary)",
          "primary-dark": "var(--user-primary-dark)",
          "accent-violet": "var(--user-accent-violet)",
          success: "var(--user-success)",
          warning: "var(--user-warning)",
          danger: "var(--user-danger)",
          "text-primary": "var(--user-text-primary)",
          "text-secondary": "var(--user-text-secondary)",
          border: "var(--user-border)"
        },
        admin: {
          bg: "var(--admin-bg)",
          surface: "var(--admin-surface)",
          card: "var(--admin-card)",
          border: "var(--admin-border)",
          cyan: "var(--admin-cyan)",
          blue: "var(--admin-blue)",
          violet: "var(--admin-violet)",
          green: "var(--admin-green)",
          amber: "var(--admin-amber)",
          red: "var(--admin-red)",
          text: "var(--admin-text)",
          dim: "var(--admin-dim)"
        },
        v2: {
          ink: "var(--ink)",
          panel: "var(--panel)",
          panel2: "var(--panel-2)",
          line: "var(--line)",
          line2: "var(--line-2)",
          white: "var(--white)",
          dim: "var(--dim)",
          dim2: "var(--dim-2)",
          acc: "var(--acc)",
          acc2: "var(--acc-2)",
          success: "var(--success)",
          warning: "var(--warning)",
          danger: "var(--danger)"
        }
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
