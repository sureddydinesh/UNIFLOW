/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-bg)',
        sidebar: 'var(--color-sidebar)',
        card: 'var(--color-card)',
        elevated: 'var(--color-elevated)',
        surface: {
          secondary: 'var(--color-surface-secondary)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          soft: 'var(--color-primary-soft)',
        },
        emerald: {
          custom: 'var(--color-emerald)',
        },
        text: {
          main: 'var(--color-text-main)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        border: {
          subtle: 'var(--color-border)',
        },
        status: {
          warning: 'var(--color-warning)',
          error: 'var(--color-error)',
        },
        atmos: {
          navy: '#090B1A',
          indigo: '#11142B',
          violet: '#20163E',
          purple: '#9471FF',
          periwinkle: '#7197FF',
          cyan: '#85DFFF',
          lavender: '#C9B9FF',
          white: '#F8F7FF',
          muted: '#9D98B8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 0 1px rgba(139,128,255,0.2), 0 4px 20px -4px rgba(139,128,255,0.3)',
        'glow-emerald': '0 0 0 1px rgba(52,211,153,0.2), 0 4px 20px -4px rgba(52,211,153,0.3)',
        'glow-primary-sm': '0 0 16px -3px rgba(139,128,255,0.25)',
        'card-dark': '0 2px 8px -2px rgba(0,0,0,0.3), 0 8px 32px -8px rgba(0,0,0,0.5)',
        'card-light': '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px -4px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 20px -4px rgba(139,128,255,0.2)',
        'modal': '0 8px 32px -4px rgba(0,0,0,0.4), 0 24px 64px -12px rgba(0,0,0,0.6)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.04)',
        'atmos-glow': '0 0 60px -10px rgba(148, 113, 255, 0.35)',
        'atmos-glow-lg': '0 0 100px -20px rgba(148, 113, 255, 0.45), 0 0 40px -10px rgba(113, 151, 255, 0.35)',
        'atmos-card': '0 12px 40px -8px rgba(9, 11, 26, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'atmos-card-hover': '0 20px 50px -12px rgba(148, 113, 255, 0.3), 0 0 0 1px rgba(148, 113, 255, 0.35)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      ringWidth: {
        DEFAULT: '1.5px',
      },
      transitionDuration: {
        '120': '120ms',
        '180': '180ms',
        '250': '250ms',
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-subtle': 'bounce 2s ease-in-out infinite',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
        'gradient-emerald': 'linear-gradient(135deg, var(--color-emerald), #10B981)',
        'gradient-card': 'linear-gradient(135deg, var(--color-card), var(--color-elevated))',
      },
    },
  },
  plugins: [],
}
