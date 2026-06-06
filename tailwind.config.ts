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
        display: ['Poppins', '"Fredoka One"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'Nunito', 'system-ui', 'sans-serif'],
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
          coral: "hsl(var(--rainbow-coral))",
        },
        sky: {
          light: "hsl(var(--sky-light))",
          base: "hsl(var(--sky-base))",
          cloud: "hsl(var(--sky-cloud))",
          deep: "hsl(var(--sky-deep))",
        },
        feature: {
          green: "hsl(var(--card-green))",
          purple: "hsl(var(--card-purple))",
          orange: "hsl(var(--card-orange))",
          blue: "hsl(var(--card-blue))",
          pink: "hsl(var(--card-pink))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1.5rem",
        "3xl": "2rem",
        "4xl": "2.5rem",
        "5xl": "3rem",
      },
      boxShadow: {
        'cartoon': '0 10px 0 -2px hsl(var(--border)), 0 15px 35px -5px hsl(var(--foreground) / 0.12)',
        'cartoon-hover': '0 16px 0 -2px hsl(var(--border)), 0 22px 50px -5px hsl(var(--foreground) / 0.18)',
        'sticker': '0 12px 0 -3px rgba(0,0,0,0.1), 0 20px 40px -10px rgba(0,0,0,0.15), inset 0 -4px 0 0 rgba(0,0,0,0.05)',
        'sticker-hover': '0 20px 0 -3px rgba(0,0,0,0.1), 0 30px 60px -15px rgba(0,0,0,0.2), inset 0 -4px 0 0 rgba(0,0,0,0.05)',
        'btn': '0 6px 0 hsl(var(--primary-foreground) / 0.25), 0 8px 25px hsl(var(--primary) / 0.35)',
        'btn-hover': '0 4px 0 hsl(var(--primary-foreground) / 0.25), 0 6px 20px hsl(var(--primary) / 0.4)',
        'glow-yellow': '0 0 40px hsl(51 100% 50% / 0.5)',
        'glow-pink': '0 0 40px hsl(330 100% 71% / 0.5)',
        'glow-purple': '0 0 40px hsl(260 50% 65% / 0.5)',
        'glow-blue': '0 0 40px hsl(199 89% 60% / 0.5)',
        'inner-glow': 'inset 0 2px 10px rgba(255,255,255,0.3)',
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
          "50%": { transform: "scale(1.08)" },
          "70%": { transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(-5deg)" },
          "50%": { transform: "rotate(5deg)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "icon-float": {
          "0%, 100%": { transform: "translateY(0px) rotate(-5deg)" },
          "25%": { transform: "translateY(-10px) rotate(0deg)" },
          "50%": { transform: "translateY(0px) rotate(5deg)" },
          "75%": { transform: "translateY(-5px) rotate(0deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(51 100% 50% / 0.4), 0 6px 0 hsl(35 100% 35%)" },
          "50%": { boxShadow: "0 0 40px hsl(51 100% 50% / 0.6), 0 6px 0 hsl(35 100% 35%)" },
        },
        "sticker-wiggle": {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "25%": { transform: "rotate(-3deg) scale(1.02)" },
          "50%": { transform: "rotate(3deg) scale(1.02)" },
          "75%": { transform: "rotate(-2deg) scale(1.01)" },
          "100%": { transform: "rotate(0deg) scale(1)" },
        },
        "rainbow-pulse": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
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
        "float-slow": "float 8s ease-in-out infinite",
        "icon-float": "icon-float 4s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "sticker-wiggle": "sticker-wiggle 0.5s ease-in-out",
        "rainbow-pulse": "rainbow-pulse 3s ease infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;