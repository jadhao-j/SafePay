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
          red: "var(--admin-red)"
        }
      },
      fontFamily: {
        display: ["var(--font-bebas-neue)", "sans-serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
