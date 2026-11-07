import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0a',
          900: '#0f0f17',
          800: '#1a1a2e',
          700: '#16213e',
        },
        primary: {
          DEFAULT: '#00d4ff',
          50: '#e6fbff',
          300: '#66e5ff',
          500: '#00d4ff',
          600: '#00a8cc',
          700: '#007d99',
        },
        success: { DEFAULT: '#00ff88', 600: '#00cc6d' },
        warning: { DEFAULT: '#ffaa00', 600: '#cc8800' },
        danger: { DEFAULT: '#ff4444', 600: '#cc3636' },
        violet: { DEFAULT: '#8b5cf6' },
        muted: '#a0a0b0',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-poppins)', 'var(--font-inter)', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        'dot-pattern': 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
        'brand-gradient': 'linear-gradient(135deg, #00d4ff 0%, #8b5cf6 55%, #ff6b35 100%)',
      },
      backgroundSize: {
        grid: '48px 48px',
        dots: '22px 22px',
      },
      boxShadow: {
        glow: '0 0 24px rgba(0, 212, 255, 0.35)',
        'glow-lg': '0 0 48px rgba(0, 212, 255, 0.45)',
        'glow-success': '0 0 24px rgba(0, 255, 136, 0.35)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.35)',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'pulse-soft': 'pulse-soft 2.2s ease-in-out infinite',
        'gradient-x': 'gradient-x 6s ease infinite',
      },
    },
  },
  plugins: [],
};

export default config;
