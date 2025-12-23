import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ['"Fredoka One"', 'cursive'],
        body: ['Nunito', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        rainbow: {
          yellow: "hsl(var(--rainbow-yellow))",
          orange: "hsl(var(--rainbow-orange))",
          pink: "hsl(var(--rainbow-pink))",
          purple: "hsl(var(--rainbow-purple))",
          blue: "hsl(var(--rainbow-blue))",
          green: "hsl(var(--rainbow-green))",
        },
        sky: {
          light: "hsl(var(--sky-light))",
          base: "hsl(var(--sky-base))",
          cloud: "hsl(var(--sky-cloud))",
        },
        feature: {
          green: "hsl(var(--card-green))",
          purple: "hsl(var(--card-purple))",
          orange: "hsl(var(--card-orange))",
          blue: "hsl(var(--card-blue))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1.5rem",
        "3xl": "2rem",
        "4xl": "2.5rem",
      },
      boxShadow: {
        'cartoon': '0 8px 0 hsl(var(--border)), 0 12px 30px hsl(var(--foreground) / 0.1)',
        'cartoon-hover': '0 12px 0 hsl(var(--border)), 0 16px 40px hsl(var(--foreground) / 0.15)',
        'btn': '0 4px 0 hsl(var(--primary-foreground) / 0.3), 0 6px 20px hsl(var(--primary) / 0.3)',
        'btn-hover': '0 2px 0 hsl(var(--primary-foreground) / 0.3), 0 4px 15px hsl(var(--primary) / 0.4)',
        'glow-yellow': '0 0 30px hsl(45 100% 50% / 0.4)',
        'glow-pink': '0 0 30px hsl(330 100% 70% / 0.4)',
        'glow-purple': '0 0 30px hsl(260 50% 65% / 0.4)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "bounce-in": {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(45 100% 50% / 0.4)" },
          "50%": { boxShadow: "0 0 40px hsl(45 100% 50% / 0.6)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce-in": "bounce-in 0.6s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "wiggle": "wiggle 1s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out infinite 2s",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
