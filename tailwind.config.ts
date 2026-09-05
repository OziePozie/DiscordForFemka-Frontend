import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        display: ['Unbounded', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Golos Text"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // Editorial Clean palette — flat brand tokens через CSS-переменные,
        // чтобы переключались вместе с темой (значения — в src/index.css).
        ink: {
          DEFAULT: 'hsl(var(--ink) / <alpha-value>)',
          muted: 'hsl(var(--ink-muted) / <alpha-value>)',
          faint: 'hsl(var(--ink-faint) / <alpha-value>)',
          disabled: 'hsl(var(--ink-disabled) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'hsl(var(--line) / <alpha-value>)',
          strong: 'hsl(var(--line-strong) / <alpha-value>)',
          num: 'hsl(var(--line-num) / <alpha-value>)',
        },
        brand: 'hsl(var(--brand) / <alpha-value>)',
        success: 'hsl(var(--success) / <alpha-value>)',
        live: 'hsl(var(--live) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        pill: '999px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
};

export default config;
