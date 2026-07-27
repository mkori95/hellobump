import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Backward-compatible aliases (font-sans / font-display are used
        // throughout existing components) now point at the new three-font
        // system: body copy defaults to Nunito, display/headings to Fraunces.
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-headline)", "var(--font-body)", "serif"],
        // Semantic names matching the new spec directly.
        headline: ["var(--font-headline)", "var(--font-body)", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        ui: ["var(--font-ui)", "var(--font-body)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Explicit type scale so sizes stay consistent instead of ad hoc.
        hero: ["2rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }], // 32px
        heading: ["1.375rem", { lineHeight: "1.3" }], // 22px (20-24px range)
        body: ["1rem", { lineHeight: "1.6" }], // 16px
        caption: ["0.8125rem", { lineHeight: "1.4" }], // 13px
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        "baby-blue": {
          DEFAULT: "hsl(var(--baby-blue))",
          foreground: "hsl(var(--baby-blue-foreground))",
        },
        "baby-mint": {
          DEFAULT: "hsl(var(--baby-mint))",
          foreground: "hsl(var(--baby-mint-foreground))",
        },
        "baby-yellow": {
          DEFAULT: "hsl(var(--baby-yellow))",
          foreground: "hsl(var(--baby-yellow-foreground))",
        },
        "baby-lavender": {
          DEFAULT: "hsl(var(--baby-lavender))",
          foreground: "hsl(var(--baby-lavender-foreground))",
        },
        "baby-peach": {
          DEFAULT: "hsl(var(--baby-peach))",
          foreground: "hsl(var(--baby-peach-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
